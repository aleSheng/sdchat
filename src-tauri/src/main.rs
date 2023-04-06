#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::io::{BufRead, BufReader};
use std::time::Duration;
use std::{process::{Command, Stdio}};
use downloader::Downloader;
use serde::{Serialize, Deserialize};
use tauri::{Window};
use tauri_plugin_store;
use tokio::time::sleep;
use std::{env, path::Path, fs};
use anyhow::Result;
mod funcs;
mod downloader;

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
}

#[derive(Clone, serde::Serialize)]
struct GPU {
    name: String,
    cuda_version: String,
    memory: serde_json::Number,
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::default().build())
        // This is where you pass in your commands
        .invoke_handler(tauri::generate_handler![
            init_webui,
            start_webui,
            detect_git,
            detect_python,
            get_gpu_info,
            get_latest_image,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}


#[tauri::command]
async fn get_gpu_info() -> Result<GPU, String> {
    let gpu_name = funcs::get_gpu_name().await.unwrap();
    let cuda_version = funcs::get_cuda_version().await.unwrap();
    let gpu_memory = funcs::get_gpu_memory().await;
    Ok(GPU {
        name: gpu_name,
        cuda_version,
        memory: gpu_memory,
    })
}

#[tauri::command]
async fn detect_python(pythonpath: String) -> Result<String, String> {
    let python_version_output = Command::new(pythonpath)
        .arg("--version")
        .output()
        .expect("failed");
    let python_version = String::from_utf8(python_version_output.stdout)
                .expect("failed");
    // get "3.10.10" from "Python 3.10.10"
    let python_version = python_version.replace("Python ", "");
    Ok(python_version.trim().to_string())
}

#[tauri::command]
async fn detect_git() -> Result<String, String> {
    let git_version_output = Command::new("git")
        .arg("--version")
        .output()
        .expect("failed");
    let git_version = String::from_utf8(git_version_output.stdout)
                .expect("failed");
    // get 2.28.0.windows.1 or 2.28 use regex
    let regex = tauri::regex::Regex::new(r"\d+\.\d+").unwrap();
    let git_version = regex.find(&git_version).unwrap().as_str().to_string();

    Ok(git_version.trim().to_string())
}

#[tauri::command]
async fn get_latest_image(dir_path: String) -> String {
    // latest_image_old(dir_path, elapsed)
    funcs::latest_image(dir_path)
}

#[tauri::command]
async fn start_webui(webuipath: String, window: Window) -> String {
    let py_cmd = format!("{}\\venv\\Scripts\\python.exe", webuipath.clone());

    let child = Command::new(py_cmd)
        .arg("-u")
        .arg("launch.py")
        .current_dir(webuipath.clone())
        .env("COMMANDLINE_ARGS", "--xformers --deepdanbooru")
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    let stdout = child.stdout.expect("stdout error");

    BufReader::new(stdout)
        .lines()
        .filter_map(|line| line.ok())
        .for_each(|line| {
            println!("{}", line);
            // to emit the line to the UI, you can use the `emit` method
            window.emit("stdout", Payload {message: line}).unwrap();
        });
    // TODO the window listen to close event and kill the child process
    // window.listen("close_webui", move |_| {
    //     child.kill().unwrap();
    // });
    "start webui".to_string()
}

#[tauri::command]
async fn init_webui(webuipath: String, window: Window) -> Result<String, String> {
    let _ = window.emit("stdout", Payload {message:"initializing webui".to_string()}).unwrap();
    let mut output_str = format!("Command init_webui: {}", webuipath);
    println!("{}", output_str);
    let venv_dir = format!("{}\\venv", webuipath.clone());
    let venv_path = format!("{}\\venv\\Scripts\\python.exe", webuipath.clone());
    if funcs::check_if_file_exists(venv_dir, venv_path).await {
        println!("venv exists");
    } else {
        let output_str = funcs::create_env(webuipath.clone()).await;
        window.emit("stdout", Payload {message: output_str}).unwrap();
    }

    // pip config set global.index-url http://mirrors.cloud.tencent.com/pypi/simple
    // update the pip source config
    let pip_config = format!("{}\\venv\\Scripts\\pip.exe", webuipath.clone()); 
    let pip_config_output = Command::new(pip_config)
        .arg("config")
        .arg("set")
        .arg("global.index-url")
        .arg("http://mirrors.cloud.tencent.com/pypi/simple")
        .output()
        .expect("failed to execute pip config command");
    let pip_config_output = String::from_utf8(pip_config_output.stdout)
        .expect("failed to convert pip config output to string");
    println!("pip config output: {}", pip_config_output);
    
    let torch_whl_dir = format!("{}\\torch_whl", webuipath.clone());
    let torch_whl_file = "torch-1.13.1+cu117-cp310-cp310-win_amd64.whl".to_string();
    let torchvision_whl_file = "torchvision-0.14.2+cu117-cp310-cp310-win_amd64.whl".to_string();
    let torch_whl_download_url = "https://download.pytorch.org/whl/cu117/torch-2.0.0%2Bcu117-cp310-cp310-win_amd64.whl".to_string();
    let torchvision_whl_download_url = "https://download.pytorch.org/whl/cu117/torchvision-0.15.1%2Bcu117-cp310-cp310-win_amd64.whl".to_string();

    //check if torch is installed
    let torch_installed = funcs::check_if_python_package_installed(webuipath.clone(),"torch".to_string()).await;
    let torchvision_installed = funcs::check_if_python_package_installed(webuipath.clone(), "torchvision".to_string()).await;
    if torch_installed {
        println!("torch is installed");
    } else {
        println!("torch is not installed");
        let _ = window.emit("stdout", Payload {message: "torch is not installed".to_string()}).unwrap();
        if funcs::check_if_file_exists(torch_whl_dir.clone(), torch_whl_file.clone()).await {
            println!("torch whl exists");
        } else {
            println!("torch whl does not exist");
            let is_dir = Path::new(&torch_whl_dir).is_dir();
            if is_dir {
                println!("torch_whl dir exists");
            } else {
                println!("torch_whl dir does not exist");
                fs::create_dir(torch_whl_dir.clone()).expect("create torch_whl dir failed");
            }
            
            output_str = single_file_download(format!("{}\\{}", torch_whl_dir, torch_whl_file), torch_whl_download_url, window.clone()).await.expect("download torch whl failed");
            window.emit("stdout", Payload {message: output_str.clone()}).unwrap();
        }
        output_str = funcs::run_python_install_torch(webuipath.clone(), window.clone()).await;
        window.emit("stdout", Payload {message: output_str.clone()}).unwrap();
    }
    if torchvision_installed {
        println!("torchvision is installed");
    } else {
        println!("torchvision is not installed");
        if funcs::check_if_file_exists(torch_whl_dir.clone(), torchvision_whl_file.clone()).await {
            println!("torchvision whl exists");
        } else {
            println!("torchvision whl does not exist");
            let is_dir = Path::new(&torch_whl_dir).is_dir();
            if is_dir {
                println!("torch_whl dir exists");
            } else {
                println!("torch_whl dir does not exist");
                fs::create_dir(torch_whl_dir.clone()).expect("create torch_whl dir failed");
            }
            output_str = single_file_download(format!("{}\\{}", torch_whl_dir, torchvision_whl_file), torchvision_whl_download_url, window.clone()).await.expect("download torchvision whl failed");
            window.emit("stdout", Payload {message: output_str.clone()}).unwrap();
        }
        output_str = funcs::run_python_install_torchvision(webuipath.clone(), window.clone()).await;
        window.emit("stdout", Payload {message: output_str.clone()}).unwrap();
    }
    let _ = window.emit("stdout", Payload {message: "check xformers".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "xformers".to_string()).await {
        println!("xformers is installed");
    } else {
        output_str = funcs::run_python_install_xformers(webuipath.clone(), window.clone()).await;
        window.emit("stdout", Payload {message: output_str.clone()}).unwrap();
    }
    let _ = window.emit("stdout", Payload {message: "check codeformer".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "lpips".to_string()).await {
        println!("CodeFormer is installed");
    } else {
        output_str = funcs::run_python_install_codeformer(webuipath.clone(), window.clone()).await;
        window.emit("stdout", Payload {message: output_str.clone()}).unwrap();
    }
    let _ = window.emit("stdout", Payload {message: "check GFPGAN".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "gfpgan".to_string()).await {
        println!("gfpgan is installed");
    } else {
        output_str = funcs::run_python_install_gfpgan(webuipath.clone(), window.clone()).await;
        window.emit("stdout", Payload {message: output_str.clone()}).unwrap();
    }
    
    let _ = window.emit("stdout", Payload {message: "check CLIP".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "clip".to_string()).await {
        println!("clip is installed");
    } else {
        output_str = funcs::run_python_install_clip(webuipath.clone(), window.clone()).await;
        window.emit("stdout", Payload {message: output_str.clone()}).unwrap();
    }
    
    let _ = window.emit("stdout", Payload {message: "check open clip".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "open_clip".to_string()).await {
        println!("open_clip is installed");
    } else {
        println!("open_clip is not installed");
        output_str = funcs::run_python_install_openclip(webuipath.clone(), window.clone()).await;
        window.emit("stdout", Payload {message: output_str.clone()}).unwrap();
    }
    
    // install requirements
    output_str = funcs::run_python_install_requirements(webuipath.clone(), window.clone()).await;
    window.emit("stdout", Payload {message: "Requirements installed".to_string()}).unwrap();

    Ok(output_str)
}


// 单文件下载进度条数据结构
#[derive(Debug, Clone, Serialize, Deserialize)]
struct SingleDownloadProgress {
    pub download_url: String,
    pub percentage: u8
}

// 单个文件下载
#[tauri::command]
async fn single_file_download(save_path: String, download_url: String, window: Window) -> Result<String, String> {
    
    let downloader = Downloader::new(download_url.clone(), save_path, Some(8))
        .await
        .map_err(|_|"Error".to_string())?;
    let downloader_clone = downloader.clone();
    
    // 进度条
    tokio::spawn(async move {
        let total_size = downloader_clone.total_size();
        loop {
            let cur_size  = downloader_clone.downloaded_size().await;
            if cur_size >= total_size {
                let _ = window.emit("single_file_download", SingleDownloadProgress{ download_url: download_url.clone(), percentage: 100 });
                break;
            }
            let percentage = (cur_size as f64 * 100.0 / total_size as f64 ).round() as u8;
            let _ = window.emit("single_file_download", SingleDownloadProgress{ download_url: download_url.clone(), percentage });
            sleep(Duration::from_millis(1000)).await;
        }
    });

    // 下载
    match downloader.download().await {
        Ok(_) => {
            sleep(Duration::from_millis(100)).await
        },
        Err(_) => return Err("Download fails".to_string()),
    };
    Ok("ok".to_string())
}