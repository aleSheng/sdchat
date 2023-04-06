use std::sync::Arc;
use futures::future::join_all;
use reqwest::Client;
use thiserror::Error;
use tokio::sync::RwLock;
use anyhow::Result;
use log::error;
use std::path::Path;

const USER_AGNET: &str = "Mozilla/5.0 (iPhone; CPU iPhone OS 13_2_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/13.0.3 Mobile/15E148 Safari/604.1";


#[derive(Error, Debug)]
pub enum DownloadError {
    #[error("获取文件信息失败")]
    GetFileInfoError,
}

#[derive(Debug, Clone)]
pub struct Downloader {
    url: Arc<String>,
    filesize: Arc<u64>,
    savepath: Arc<String>,
    support_range: Arc<bool>,
    chunk_count: Arc<u8>,
    rw_lock: Arc<RwLock<u64>>,
}

#[cfg(target_family="windows")]
async fn write_bytes_to_file(filepath: &str, bytes: &[u8], offset: u64) -> Result<usize, std::io::Error> {
    use std::fs;
    use std::os::windows::fs::FileExt;
    let file = fs::OpenOptions::new()
                .create(true)
                .write(true)
                .open(filepath)?;
    file.seek_write(&bytes, offset)
}

#[cfg(target_family="unix")]
async fn write_bytes_to_file(filepath: &str, bytes: &[u8], offset: u64) -> Result<usize, std::io::Error> {
    use std::fs;
    use std::os::unix::fs::FileExt;
    let file = fs::OpenOptions::new()
                .create(true)
                .write(true)
                .open(filepath)?;
    file.write_at(bytes, offset)
}



impl Downloader {

    pub async fn new(url: String, savepath: String, chunk_count: Option<u8>) -> Result<Arc<Self>> {
        
        let response = Client::builder()
        .user_agent(USER_AGNET)
        .build()?
        .get(&url)
        .send()
        .await?;
        
        let url = Arc::new(url);
        let path = Path::new(&savepath);
        let dir = path.parent().unwrap();

        let filename = path.file_name()
            .unwrap()
            .to_str()
            .unwrap();
        let savepath = Arc::new(dir.join(filename)
            .to_str()
            .unwrap()
            .to_string()
        );

        let filesize = Arc::new(match response.content_length() {
            Some(r) => r,
            None => return Err(DownloadError::GetFileInfoError.into()),
        });

        let chunk_count = Arc::new(chunk_count.unwrap_or(4));

        let support_range = Arc::new(response.headers().get("Accept-Ranges").is_some());

        let rw_lock = Arc::new(RwLock::<u64>::new(0));
        
        Ok(Arc::new(Self{
            url,
            savepath,
            filesize,
            support_range,
            chunk_count,
            rw_lock,
        }))
    }

    pub fn total_size(&self) -> u64 {
        *self.filesize
    }

    pub fn chunk_count(&self) -> u64 {
        *self.chunk_count as u64
    }

    pub async fn downloaded_size(&self) -> u64 {
        *self.rw_lock.read().await
    }
    
    pub fn get_save_path(&self) -> String {
        self.savepath.to_string()
    }

    fn is_support_range(&self) -> bool {
        *self.support_range
    }
    
    // 普通下载
    async fn plain_download(&self) -> Result<bool> {
        let client = Client::builder()
            .user_agent(USER_AGNET)
            .build()?;

        let mut source = client.get(self.url.as_str()).send().await?;
     
        let mut offset = 0;
        
        while let Some(bytes) = source.chunk().await? {
            let mut size = self.rw_lock.write().await;
            let len = bytes.len() as u64;
            match write_bytes_to_file(self.savepath.as_str(), &bytes, offset).await {
                Ok(_) => {},
                Err(e) => { error!("Failed to write to file,  error: {:?}", e)},
        };
            offset += len;
            *size += len;
        }
        Ok(true)
    }

    // 分片下载
    async fn chunk_download(self: Arc<Self>, range: (u64, u64)) -> Result<bool> {
        let client = Client::builder()
            .user_agent(USER_AGNET)
            .build()?;
        let mut response = client.get(self.url.as_str())
                                        .header("Range", format!("bytes={}-{}", range.0, range.1))
                                        .send()
                                        .await?;
        let mut offset = range.0;

        while let Some(bytes) = response.chunk().await? {
            let mut size = self.rw_lock.write().await;
            let len = bytes.len() as u64;
           
            match write_bytes_to_file(self.savepath.as_str(), &bytes, offset).await {
                    Ok(_) => {},
                    Err(e) => { error!("Failed to write to file, error:{:?}", e)},
            };
            offset += len;
            *size += len;
        }
        Ok(true)
    }

    // 下载功能入口
    pub async fn download(self: Arc<Self>) -> Result<bool> {

        if self.total_size() < 1 {
            return Ok(false);
        }
        if !self.is_support_range() {
            return self.plain_download().await;
        }

        let chunk_size = self.total_size() / self.chunk_count() as u64;
        let mut range_list = vec![];
        let mut start = 0;
        let mut end = 0;

        while end < self.total_size() {
            end += chunk_size;
            if end > self.total_size() {
                end = self.total_size();
            }
            range_list.push((start, end));
            start = end + 1;
        }

        let mut handler_list = vec![];

        for range in range_list {
            let s = self.clone();
            let handler = tokio::spawn(async move {
                let _ = s.chunk_download(range).await;
            });
            handler_list.push(handler);
        }
        
        join_all(handler_list).await;

        Ok(true)
    }

}