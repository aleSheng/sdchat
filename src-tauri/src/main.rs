#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
use encoding::all::{GBK, UTF_8, GB18030};
use encoding::{DecoderTrap, EncoderTrap,Encoding};
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::sync::Mutex;
use std::time::Duration;
use std::{process::{Command, Stdio}};
use downloader::Downloader;
use funcs::Storage;
use serde::{Serialize, Deserialize};
use tauri::{Window, State};
use tauri_plugin_store;
use tokio::time::sleep;
use std::{env, path::Path, fs};
use anyhow::{Result};
mod funcs;
mod downloader;

// the payload type must implement `Serialize` and `Clone`.
#[derive(Clone, serde::Serialize)]
struct Payload {
  message: String,
  stdtype: String,
}

#[derive(Clone, serde::Serialize)]
struct GPU {
    name: String,
    cuda_version: String,
    memory: serde_json::Number,
}

fn main() {
    tauri::Builder::default()
        .manage(Storage {
            store: Mutex::new(HashMap::new()),
        })
        .plugin(tauri_plugin_store::Builder::default().build())
        // This is where you pass in your commands
        .invoke_handler(tauri::generate_handler![
            stop_webui,
            start_webui,
            start_llama,
            stop_llama,
            detect_git,
            detect_python,
            get_gpu_info,
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
async fn stop_webui(storage: State<'_, Storage>) -> Result<String, String> {
    let pid = storage.store.lock().unwrap().get(&"pid".to_string()).unwrap().to_string();
    let output = funcs::kill_proc(pid).await;
    println!("output: {}", output.to_string());
    Ok(output.to_string())
}

#[tauri::command]
async fn start_webui(webuipath: String, window: Window, storage: State<'_, Storage>) -> Result<String, String> {
    let _ = window.emit("stdout", Payload {message:"initializing webui".to_string(), stdtype: "stdout".to_string()}).unwrap();
    // git clone webui from github
    let webui_github_url = "https://github.com/AUTOMATIC1111/stable-diffusion-webui.git".to_string();
    let _ = funcs::check_or_clone_webui(webui_github_url, webuipath.clone(), &window);

    let mut output_str = format!("Command init_webui: {}", webuipath);
    println!("{}", output_str);
    let venv_dir = format!("{}\\venv", webuipath.clone());
    let venv_path = format!("{}\\venv\\Scripts\\python.exe", webuipath.clone());
    if funcs::check_if_file_exists(venv_dir, venv_path).await {
        println!("venv exists");
    } else {
        let output_str = funcs::create_env(webuipath.clone()).await;
        window.emit("stdout", Payload {message: output_str, stdtype: "stdout".to_string()}).unwrap();
    }

    // pip config set global.index-url http://mirrors.cloud.tencent.com/pypi/simple
    // update the pip source config
    let pip_config = format!("{}\\venv\\Scripts\\pip.exe", webuipath.clone()); 
    let pip_config_output = Command::new(pip_config)
        .arg("config")
        .arg("set")
        .arg("global.index-url")
        .arg("https://mirrors.cloud.tencent.com/pypi/simple")
        .output()
        .expect("failed to execute pip config command");
    let pip_config_output = String::from_utf8(pip_config_output.stdout)
        .expect("failed to convert pip config output to string");
    println!("pip config output: {}", pip_config_output);
    
    let torch_whl_dir = format!("{}\\torch_whl", webuipath.clone());
    let torch_whl_file = "torch-2.0.0+cu117-cp310-cp310-win_amd64.whl".to_string();
    let torchvision_whl_file = "torchvision-0.15.1+cu117-cp310-cp310-win_amd64.whl".to_string();
    let torch_whl_download_url = "https://download.pytorch.org/whl/cu117/torch-2.0.0%2Bcu117-cp310-cp310-win_amd64.whl".to_string();
    let torchvision_whl_download_url = "https://download.pytorch.org/whl/cu117/torchvision-0.15.1%2Bcu117-cp310-cp310-win_amd64.whl".to_string();

    //check if torch is installed
    let torch_installed = funcs::check_if_python_package_installed(webuipath.clone(),"torch".to_string()).await;
    let torchvision_installed = funcs::check_if_python_package_installed(webuipath.clone(), "torchvision".to_string()).await;
    if torch_installed {
        println!("torch is installed");
    } else {
        println!("torch is not installed");
        let _ = window.emit("stdout", Payload {message: "torch is not installed".to_string(), stdtype: "stdout".to_string()}).unwrap();
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
            window.emit("stdout", Payload {message: output_str.clone(), stdtype: "stdout".to_string()}).unwrap();
        }
        output_str = funcs::run_python_install_torch(webuipath.clone(), &storage, &window).await;
        window.emit("stdout", Payload {message: output_str.clone(), stdtype: "stdout".to_string()}).unwrap();
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
            window.emit("stdout", Payload {message: output_str.clone(), stdtype: "stdout".to_string()}).unwrap();
        }
        output_str = funcs::run_python_install_torchvision(webuipath.clone(), &storage, &window).await;
        window.emit("stdout", Payload {message: output_str.clone(), stdtype: "stdout".to_string()}).unwrap();
    }

    // check if repositories is inside the webui folder
    let repositories_dir = format!("{}\\repositories", webuipath.clone());
    let is_dir = Path::new(&repositories_dir).is_dir();
    if is_dir {
        println!("repositories dir exists");
    } else {
        println!("repositories dir does not exist");
        fs::create_dir(repositories_dir.clone()).expect("create repositories dir failed");
    }

    // check if gfpgan is inside the repositories folder todo
    let name = "GFPGAN";
    let git_url = "https://github.com/TencentARC/GFPGAN.git";
    let commit = "8d2447a2d918f8eba5a4a01463fd48e45126a379";
    let path_dir = format!("{}\\repositories\\{}", webuipath.clone(), &name);
    let _ = funcs::check_or_clone_repo(name.to_string(), git_url.to_string(), path_dir.to_string(), commit.to_string(), &window);

    let name = "CLIP";
    let git_url = "https://github.com/openai/CLIP.git";
    let commit = "d50d76daa670286dd6cacf3bcd80b5e4823fc8e1";
    let path_dir = format!("{}\\repositories\\{}", webuipath.clone(), &name);
    let _ = funcs::check_or_clone_repo(name.to_string(), git_url.to_string(), path_dir.to_string(), commit.to_string(), &window);

    let name = "open_clip";
    let git_url = "https://github.com/mlfoundations/open_clip.git";
    let commit = "bb6e834e9c70d9c27d0dc3ecedeebeaeb1ffad6b";
    let path_dir = format!("{}\\repositories\\{}", webuipath.clone(), &name);
    let _ = funcs::check_or_clone_repo(name.to_string(), git_url.to_string(), path_dir.to_string(), commit.to_string(), &window);

    let name = "stable_diffusion";
    let git_url = "https://github.com/Stability-AI/stablediffusion.git";
    let commit = "cf1d67a6fd5ea1aa600c4df58e5b47da45f6bdbf";
    let path_dir = format!("{}\\repositories\\stable-diffusion-stability-ai", webuipath.clone());
    let _ = funcs::check_or_clone_repo(name.to_string(), git_url.to_string(), path_dir.to_string(), commit.to_string(), &window);

    let name = "taming-transformers";
    let git_url = "https://github.com/CompVis/taming-transformers.git";
    let commit = "24268930bf1dce879235a7fddd0b2355b84d7ea6";
    let path_dir = format!("{}\\repositories\\{}", webuipath.clone(), &name);
    let _ = funcs::check_or_clone_repo(name.to_string(), git_url.to_string(), path_dir.to_string(), commit.to_string(), &window);

    let name = "k-diffusion";
    let git_url = "https://github.com/crowsonkb/k-diffusion.git";
    let commit = "5b3af030dd83e0297272d861c19477735d0317ec";
    let path_dir = format!("{}\\repositories\\{}", webuipath.clone(), &name);
    let _ = funcs::check_or_clone_repo(name.to_string(), git_url.to_string(), path_dir.to_string(), commit.to_string(), &window);

    let name = "CodeFormer";
    let git_url = "https://github.com/sczhou/CodeFormer.git";
    let commit = "c5b4593074ba6214284d6acd5f1719b6c5d739af";
    let path_dir = format!("{}\\repositories\\{}", webuipath.clone(), &name);
    let _ = funcs::check_or_clone_repo(name.to_string(), git_url.to_string(), path_dir.to_string(), commit.to_string(), &window);

    let name = "blip";
    let git_url = "https://github.com/salesforce/BLIP.git";
    let commit = "48211a1594f1321b00f14c9f7a5b4813144b2fb9";
    let path_dir = format!("{}\\repositories\\{}", webuipath.clone(), &name);
    let _ = funcs::check_or_clone_repo(name.to_string(), git_url.to_string(), path_dir.to_string(), commit.to_string(), &window);


    let _ = window.emit("stdout", Payload {message: "check xformers".to_string(), stdtype: "stdout".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "xformers".to_string()).await {
        println!("xformers is installed");
    } else {
        output_str = funcs::run_python_install_xformers(webuipath.clone(), &storage, &window).await;
        window.emit("stdout", Payload {message: output_str.clone(), stdtype: "stdout".to_string()}).unwrap();
    }
    let _ = window.emit("stdout", Payload {message: "check codeformer".to_string(), stdtype: "stdout".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "lpips".to_string()).await {
        println!("CodeFormer is installed");
    } else {
        output_str = funcs::run_python_install_codeformer(webuipath.clone(), &storage, &window).await;
        window.emit("stdout", Payload {message: output_str.clone(), stdtype: "stdout".to_string()}).unwrap();
    }
    let _ = window.emit("stdout", Payload {message: "check GFPGAN".to_string(), stdtype: "stdout".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "gfpgan".to_string()).await {
        println!("gfpgan is installed");
    } else {
        output_str = funcs::run_python_install_gfpgan(webuipath.clone(), &storage, &window).await;
        window.emit("stdout", Payload {message: output_str.clone(), stdtype: "stdout".to_string()}).unwrap();
    }
    
    let _ = window.emit("stdout", Payload {message: "check CLIP".to_string(), stdtype: "stdout".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "clip".to_string()).await {
        println!("clip is installed");
    } else {
        output_str = funcs::run_python_install_clip(webuipath.clone(), &storage, &window).await;
        window.emit("stdout", Payload {message: output_str.clone(), stdtype: "stdout".to_string()}).unwrap();
    }
    
    let _ = window.emit("stdout", Payload {message: "check open clip".to_string(), stdtype: "stdout".to_string()}).unwrap();
    if funcs::check_if_python_package_installed(webuipath.clone(), "open_clip".to_string()).await {
        println!("open_clip is installed");
    } else {
        println!("open_clip is not installed");
        output_str = funcs::run_python_install_openclip(webuipath.clone(), &storage, &window).await;
        window.emit("stdout", Payload {message: output_str.clone(), stdtype: "stdout".to_string()}).unwrap();
    }
    
    // install requirements
    output_str = funcs::run_python_install_requirements(webuipath.clone(), &storage, &window).await;
    window.emit("stdout", Payload {message: "Requirements installed".to_string(), stdtype: "stdout".to_string()}).unwrap();

    // start webui
    let py_cmd = format!("{}\\venv\\Scripts\\python.exe", webuipath.clone());

    let child = Command::new(py_cmd)
        .arg("-u")
        .arg("webui.py")
        .arg("--skip-version-check")
        .arg("--xformers")
        .arg("--deepdanbooru")
        .arg("--api")
        .arg("--no-gradio-queue")
        .arg("--cors-allow-origins=http://localhost:3000")
        .current_dir(webuipath.clone())
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();
    
    storage.store.lock().unwrap().insert("pid".to_string(), child.id().to_string());
    let stdout = child.stdout.expect("stdout error");
    
    BufReader::new(stdout)
        .lines()
        .filter_map(|line| line.ok())
        .for_each(|line| {
            println!("{}", line);
            // to emit the line to the UI, you can use the `emit` method
            window.emit("stdout", Payload {message: line, stdtype: "stdout".to_string()}).unwrap();
        });

    Ok("".to_string())
}

#[tauri::command]
async fn stop_llama(storage: State<'_, Storage>) -> Result<String, String> {
    let pid = storage.store.lock().unwrap().get(&"llamapid".to_string()).expect("llamapid not found").to_string();
    let output = funcs::kill_proc(pid).await;
    println!("stop llama output: {}", output.to_string());
    storage.store.lock().unwrap().remove_entry(&"llamapid".to_string()).expect("llamapid not found");
    Ok(output.to_string())
}
#[tauri::command]
async fn start_llama( modelpath: String, storage: State<'_, Storage>, window: Window ) -> Result<String, String> {
    let (mut rx, mut child) = tauri::api::process::Command::new_sidecar("main")
    .expect("side car error")
    .args(["-m", &modelpath, "-ins","-c", "2048","--temp","0.2","-n","2560"])
    .spawn()
    .expect("Failed to spawn cargo");

    storage.store.lock().unwrap().insert("llamapid".to_string(), child.pid().to_string());
    let child = std::sync::Arc::new(Mutex::new(child));
    window.listen("llamamsg", move |event| {
        let payload: serde_json::Value = serde_json::from_str(event.payload().unwrap()).unwrap();
        let msg = payload["message"].as_str().unwrap();
        let msg = format!("{}\n", msg);
        child
            .lock()
            .unwrap()
            .write(msg.as_bytes())
            .unwrap();
    });

    tauri::async_runtime::spawn(async move {
      while let Some(event) = rx.recv().await {
        println!("EVENT RECEIVED {:?}", event);
        if let tauri::api::process::CommandEvent::Stderr(line) = &event {
          window.emit("llamamsg", Payload {message: line.clone(), stdtype: "stdout".to_string()}).unwrap();
        }
        if let tauri::api::process::CommandEvent::Stdout(line) = event {
            window.emit("llamamsg", Payload {message: line, stdtype: "stdout".to_string()}).unwrap();
        }
      }
    });
  Ok("done".to_string())
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