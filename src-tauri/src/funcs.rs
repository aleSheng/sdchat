use std::{fs, fs::Metadata, process::{Command, Stdio}, time::SystemTime, io::{BufReader, BufRead}, path::Path};
use tauri::regex::Regex;
use tauri::Window;

use crate::Payload;

// Get the latest image created in the output directory
pub fn latest_image(dir_path: String) -> String {
    let mut files: Vec<(String, SystemTime)> = Vec::new();
    let mut file_name: String;
    let mut metadata: Metadata;

    for entry in fs::read_dir(dir_path).unwrap() {
        let entry = entry.unwrap();
        let path = entry.path();

        metadata = fs::metadata(&path).unwrap();

        // get the modified date
        let _modified = metadata.modified().unwrap();

        // get the created date
        let created = metadata.created().unwrap();

        let _file_type = metadata.file_type();

        let file_extension = path
            .extension()
            .unwrap_or_default()
            .to_str()
            .unwrap_or_default()
            .to_string();

        file_name = path
            .file_name()
            .unwrap_or_default()
            .to_str()
            .unwrap()
            .to_string();

        if file_extension == "png" {
            files.push((file_name, created));
        }
    }

    // sort the files by the modified date
    files.sort_by(|a, b| a.1.cmp(&b.1));

    // return the most recent image
    let mut latest_image: String = "".to_string(); // "" by default
    if files.len() > 0 {
        latest_image = files.last().unwrap().0.to_string();
    }

    latest_image
}

// Runs the find command to get the latest image:
// find . -depth 1 -type f -ctime -2130s | sort -r | head -n1
// "find all files in the current directory, depth of 1 (no subfolders), created in the last  2130s, sort by time created, and return the first one"
// Output: grid-0034.png
// @see https://rust-lang-nursery.github.io/rust-cookbook/os/external.html#run-piped-external-commands
// @deprecated
pub fn _latest_image_old(dir_path: String, elapsed: String) -> String {
    let mut output: String = "".to_string();

    let find_args: [&str; 9] = [
        &dir_path,
        "-name",
        "*.png",
        "-depth",
        "1",
        "-type",
        "f",
        "-ctime",
        &format!("-{}s", elapsed),
    ];
    let mut find_output_child = std::process::Command::new("find")
        .args(&find_args)
        .current_dir(&dir_path)
        .stdout(Stdio::piped())
        .spawn()
        .expect("Failed to execute `find` command");

    if let Some(find_output) = find_output_child.stdout.take() {
        let mut sort_output_child = Command::new("sort")
            .arg("-r")
            .stdin(find_output)
            .stdout(Stdio::piped())
            .spawn()
            .expect("Failed to execute `sort` command");

        find_output_child.wait().expect("Failed to wait on `find`");

        if let Some(sort_output) = sort_output_child.stdout.take() {
            let head_output_child = Command::new("head")
                .args(&["-n", "1"])
                .stdin(sort_output)
                .stdout(Stdio::piped())
                .spawn()
                .expect("Failed to execute `head` command");

            let head_stdout = head_output_child
                .wait_with_output()
                .expect("Failed to wait on `head`");

            sort_output_child.wait().expect("Failed to wait on `sort`");

            // convert the output to a string
            // /absolute/path/to/Stable/Diffusion/directory/output/grid-0034.png
            output = String::from_utf8(head_stdout.stdout)
                .expect("failed to convert find output to string");

            // remove the path from the beginning of the string
            let from: String = format!("{}/", &dir_path); // /absolute/path/to/Stable/Diffusion/directory/output/
            output = output.replace(&from, ""); // grid-0034.png\n

            // remove the newline from the end of the string
            output = output.replace("\n", ""); // grid-0034.png
        }
    }

    output
}

// use nvidia-smi to get the version of cuda
pub async fn get_cuda_version() -> Result<String, String> {
    let output = std::process::Command::new("nvidia-smi")
        .output()
        .expect("nvida-smi error");
    
    let lines = String::from_utf8(output.stdout).unwrap();
    // find a line matches the pattern: "CUDA Version: 11.0"
    let re = Regex::new(r"CUDA Version: (\d+\.\d+)").unwrap();
    let line = re.captures(&lines).unwrap().get(1).unwrap().as_str();

    Ok(line.trim().to_string())
}

// check gpu and cuda return Result<String, String>
pub async fn get_gpu_name() -> Result<String, String> {
    let output = std::process::Command::new("nvidia-smi")
        .args(&["--query-gpu=gpu_name", "--format=csv,noheader"])
        .output()
        .expect("nvida-smi error");
    
    let line = String::from_utf8(output.stdout).unwrap();
    if line.contains("NVIDIA-SMI has failed because it couldn't communicate with the NVIDIA driver. Make sure that the latest NVIDIA driver is installed and running.") {
        return Err("NVIDIA driver not installed".to_string());
    }
    if line.contains("No devices were found") {
        return Err("No NVIDIA GPU found".to_string());
    }
    // return the name the gpu
    Ok(line.trim().to_string())
}

// get gpu memory as number in GB
pub async fn get_gpu_memory() -> serde_json::Number {
    let output = std::process::Command::new("nvidia-smi")
        .args(&["--query-gpu=memory.total", "--format=csv,noheader"])
        .output()
        .expect("nvida-smi error");
    
    let line = String::from_utf8(output.stdout).unwrap();
    // get the number and convert to GB
    let re = Regex::new(r"\d+").unwrap();
    let cap = re.captures(&line).unwrap();
    let memory = cap.get(0).unwrap().as_str().parse::<u32>().unwrap();
    let memory = memory / 1000;
    serde_json::Number::from(memory)
    
}


pub async fn create_env(webuipath: String) -> String {
    let cmd = "python".to_string();
    let venv_path = format!("-m venv {}\\venv", webuipath);
    let args = venv_path.split(" ").collect::<Vec<&str>>();
    let output = std::process::Command::new(&cmd)
        .args(&args)
        .output()
        .expect("Failed to execute command");
    let output = String::from_utf8(output.stdout).unwrap();
    println!("{}", output);
    output
}

// check python package using importlib util find_spec
pub async fn check_if_python_package_installed(webuipath: String, package: String) -> bool {
    let cmd = format!("{}\\venv\\Scripts\\python.exe", webuipath);
    let args = vec!["-u".to_string(), "-c".to_string(), format!("import importlib.util; spec = importlib.util.find_spec('{}'); print(spec is not None)", package)];
    let output = std::process::Command::new(&cmd)
        .args(&args)
        .output()
        .expect("Failed to execute command");
    let output = String::from_utf8(output.stdout).unwrap();
    println!("check if {} installed: {}", package, output);
    if output.contains("True") {
        true
    } else {
        false
    }
}

pub async fn run_python_install_torch(webuipath: String, window: Window) -> String {
    let args = "-u -m pip install .\\torch_whl\\torch-1.13.1+cu117-cp310-cp310-win_amd64.whl".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, window).await
}
pub async fn run_python_install_torchvision(webuipath: String, window: Window) -> String {
    let args = "-u -m pip install .\\torch_whl\\torchvision-0.14.1+cu117-cp310-cp310-win_amd64.whl".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, window).await
}

pub async fn run_python_install_xformers(webuipath: String, window: Window) -> String {
    let args = "-u -m pip install -U -I --no-deps xformers".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, window).await
}

pub async fn run_python_install_codeformer(webuipath: String, window: Window) -> String {
    let codeformer_requirment = format!("-u -m pip install -r {}\\repositories\\Codeformer\\requirements.txt", webuipath);
    let args = codeformer_requirment.split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, window).await
}

pub async fn run_python_install_requirements(webuipath: String, window: Window) -> String {
    let args = "-u -m pip install -r requirements.txt".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, window).await
}

pub async fn run_python_install_gfpgan(webuipath: String, window: Window) -> String {
    let args = "-u -m pip install -e .\\repositories\\GFPGAN\\".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, window).await
}
pub async fn run_python_install_clip(webuipath: String, window: Window) -> String {
    let args = "-u -m pip install -e .\\repositories\\CLIP\\".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, window).await
}
pub async fn run_python_install_openclip(webuipath: String, window: Window) -> String {
    let args = "-u -m pip install -e .\\repositories\\open_clip\\".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, window).await
}

pub async fn run_venv_py(webuipath: String, args: Vec<&str>, window: Window) -> String{
    let cmd = format!("{}\\venv\\Scripts\\python.exe", webuipath.clone());
    run_commands(webuipath, cmd, args, window).await
}
/**
 * Run a command in a subprocess and emit the output to the UI
 */
pub async fn run_commands(webuipath: String, cmd: String, args: Vec<&str>, window: Window) -> String {
    let msg = format!("{} {}", cmd, args.clone().join("").to_string());
    window.emit("stdout", Payload {message: msg}).unwrap();
    let output = std::process::Command::new(cmd)
        .args(args)
        .current_dir(webuipath)
        .stdout(Stdio::piped())
        .spawn()
        .expect("spawn error")
        .stdout
        .expect("stdout error");
    
    BufReader::new(output)
        .lines()
        .filter_map(|line| line.ok())
        .for_each(|line| {
            println!("{}", line);
            window.emit("stdout", Payload {message: line}).unwrap();
        });
    "done".to_string()
}

pub async fn check_if_file_exists(dir_path:String, file_path: String) -> bool {
    let path = Path::new(&dir_path).join(file_path);
    path.exists()
}