use std::{fs, fs::Metadata, process::{Command, Stdio}, time::SystemTime, io::{BufReader, BufRead}, path::Path, collections::HashMap, sync::Mutex};
use tauri::{regex::Regex, State};
use tauri::Window;

use crate::Payload;

pub struct Storage {
    pub store: Mutex<HashMap<String, String>>,
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

pub fn check_or_clone_webui(webui_url: String, webui_path: String, window: &Window) -> Result<(), String> {
    // check webui.py exists
    let webui_py_file_path = format!("{}\\webui.py", webui_path);
    let is_file = Path::new(&webui_py_file_path).is_file();
    if is_file {
        println!("webui.py exists");
        let _ = window.emit("stdout", Payload {message: "webui.py exists".to_string(), stdtype: "stdout".to_string()}).unwrap();
        // TODO git pull to update
        // let repo = git2::Repository::open(webui_path).unwrap();
        // let mut remote = repo.find_remote("origin").unwrap();
        // let mut cb = git2::RemoteCallbacks::new();
        // cb.credentials(|_url, username_from_url, _allowed_types| {
        //     git2::Cred::ssh_key_from_agent(username_from_url.unwrap())
        // });

        // // Print out our transfer progress.
        // cb.transfer_progress(|stats| {
        //     if stats.received_objects() == stats.total_objects() {
        //         print!(
        //             "Resolving deltas {}/{}\r",
        //             stats.indexed_deltas(),
        //             stats.total_deltas()
        //         );
        //     } else if stats.total_objects() > 0 {
        //         print!(
        //             "Received {}/{} objects ({}) in {} bytes\r",
        //             stats.received_objects(),
        //             stats.total_objects(),
        //             stats.indexed_objects(),
        //             stats.received_bytes()
        //         );
        //     }
        //     true
        // });

        // let mut fo = git2::FetchOptions::new();
        // fo.remote_callbacks(cb);
        // // Always fetch all tags.
        // // Perform a download and also update tips
        // fo.download_tags(git2::AutotagOption::All);
        // println!("Fetching {} for repo", remote.name().unwrap());
        // remote.fetch(&["master"], Some(&mut fo), None).unwrap();

        // let fetch_head = repo.find_reference("FETCH_HEAD").unwrap();
        // let fetch_commit = repo.reference_to_annotated_commit(&fetch_head).unwrap();
        // do_merge(&repo, &"master", fetch_commit).unwrap();

    } else {
        println!("webui.py does not exist. Cloning repository...");
        let _ = window.emit("stdout", Payload {message: "webui.py does not exist. Cloning repository...".to_string(), stdtype: "stdout".to_string()}).unwrap();
        let repo = git2::Repository::clone(&webui_url, webui_path).expect("clone error");
    }
    Ok(())
}

pub fn check_or_clone_repo(name:String, repo_url: String, path_dir: String, commit: String, window: &Window) -> Result<(), String> {
    let is_dir = Path::new(&path_dir).is_dir();
    if is_dir {
        println!("{} dir exists", name);
    } else {
        println!("{} dir does not exist. Cloning repository...", name);
        let _ = window.emit("stdout", Payload {message: format!("{} dir does not exist. Cloning repository...", name), stdtype: "stdout".to_string()}).unwrap();
        let repo = git2::Repository::clone(&repo_url, path_dir).expect("clone error");
        let obj: git2::Object = repo.find_commit(git2::Oid::from_str(&commit).unwrap()).unwrap().into_object();
        repo.checkout_tree(&obj, None).unwrap();
        repo.set_head_detached(obj.id()).unwrap();
    }
    Ok(())
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

pub async fn run_python_install_torch(webuipath: String, storage: &State<'_, Storage>, window: &Window) -> String {
    let args = "-u -m pip install .\\torch_whl\\torch-1.13.1+cu117-cp310-cp310-win_amd64.whl".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, storage, window).await
}
pub async fn run_python_install_torchvision(webuipath: String, storage: &State<'_, Storage>, window: &Window) -> String {
    let args = "-u -m pip install .\\torch_whl\\torchvision-0.14.1+cu117-cp310-cp310-win_amd64.whl".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, storage, window).await
}

pub async fn run_python_install_xformers(webuipath: String, storage: &State<'_, Storage>, window: &Window) -> String {
    let args = "-u -m pip install -U -I --no-deps xformers".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, storage, window).await
}

pub async fn run_python_install_codeformer(webuipath: String, storage: &State<'_, Storage>, window: &Window) -> String {
    let codeformer_requirment = format!("-u -m pip install -r {}\\repositories\\Codeformer\\requirements.txt", webuipath);
    let args = codeformer_requirment.split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, storage, window).await
}

pub async fn run_python_install_requirements(webuipath: String, storage: &State<'_, Storage>, window: &Window) -> String {
    let args = "-u -m pip install -r requirements.txt".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, storage, window).await
}

pub async fn run_python_install_gfpgan(webuipath: String, storage: &State<'_, Storage>, window: &Window) -> String {
    let args = "-u -m pip install -e .\\repositories\\GFPGAN\\".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, storage, window).await
}
pub async fn run_python_install_clip(webuipath: String, storage: &State<'_, Storage>, window: &Window) -> String {
    let args = "-u -m pip install -e .\\repositories\\CLIP\\".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, storage, window).await
}
pub async fn run_python_install_openclip(webuipath: String, storage: &State<'_, Storage>, window: &Window) -> String {
    let args = "-u -m pip install -e .\\repositories\\open_clip\\".split(" ").collect::<Vec<&str>>();
    run_venv_py(webuipath, args, storage, window).await
}

pub async fn run_venv_py(webuipath: String, args: Vec<&str>, storage: &State<'_, Storage>, window: &Window) -> String{
    let cmd = format!("{}\\venv\\Scripts\\python.exe", webuipath.clone());
    run_commands(webuipath, cmd, args, storage, window).await
}
/**
 * Run a command in a subprocess and emit the output to the UI
 */
pub async fn run_commands(webuipath: String, cmd: String, args: Vec<&str>, storage: &State<'_, Storage>, window: &Window) -> String {
    let msg = format!("{} {}", cmd, args.clone().join("").to_string());
    window.emit("stdout", Payload {message: msg, stdtype: "stdout".to_string()}).unwrap();
    let child = std::process::Command::new(cmd)
        .args(args)
        .current_dir(webuipath)
        .stdout(Stdio::piped())
        .spawn()
        .expect("spawn error");
    storage.store.lock().unwrap().insert("pid".to_string(), child.id().to_string());
    let output = child.stdout
        .expect("stdout error");
    
    BufReader::new(output)
        .lines()
        .filter_map(|line| line.ok())
        .for_each(|line| {
            println!("{}", line);
            window.emit("stdout", Payload {message: line, stdtype: "stdout".to_string()}).unwrap();
        });
    "done".to_string()
}

pub async fn check_if_file_exists(dir_path:String, file_path: String) -> bool {
    let path = Path::new(&dir_path).join(file_path);
    path.exists()
}

/**
 * Kill a process tree
 */
pub async fn kill_proc(pid: String) -> String {
    let _ = if cfg!(target_os = "windows") {
        Command::new("taskkill")
            .args(["/pid", &pid.to_string(), "/T", "/F"])
            .output()
            .expect("Failed to kill process tree")
    } else {
        Command::new("kill")
            .arg("-9")
            .arg(pid)
            .output()
            .expect("Failed to kill process tree")
    };
    // let output_str = String::from_utf8(output.stdout).expect("Failed to kill process tree");
    // output_str
    "".to_string()
}

// git2 functions for git pull

fn fast_forward(
    repo: &git2::Repository,
    lb: &mut git2::Reference,
    rc: &git2::AnnotatedCommit,
) -> Result<(), git2::Error> {
    let name = match lb.name() {
        Some(s) => s.to_string(),
        None => String::from_utf8_lossy(lb.name_bytes()).to_string(),
    };
    let msg = format!("Fast-Forward: Setting {} to id: {}", name, rc.id());
    println!("{}", msg);
    lb.set_target(rc.id(), &msg)?;
    repo.set_head(&name)?;
    repo.checkout_head(Some(
        git2::build::CheckoutBuilder::default()
            // For some reason the force is required to make the working directory actually get updated
            // I suspect we should be adding some logic to handle dirty working directory states
            // but this is just an example so maybe not.
            .force(),
    ))?;
    Ok(())
}

fn normal_merge(
    repo: &git2::Repository,
    local: &git2::AnnotatedCommit,
    remote: &git2::AnnotatedCommit,
) -> Result<(), git2::Error> {
    let local_tree = repo.find_commit(local.id())?.tree()?;
    let remote_tree = repo.find_commit(remote.id())?.tree()?;
    let ancestor = repo
        .find_commit(repo.merge_base(local.id(), remote.id())?)?
        .tree()?;
    let mut idx = repo.merge_trees(&ancestor, &local_tree, &remote_tree, None)?;

    if idx.has_conflicts() {
        println!("Merge conflicts detected...");
        repo.checkout_index(Some(&mut idx), None)?;
        return Ok(());
    }
    let result_tree = repo.find_tree(idx.write_tree_to(repo)?)?;
    // now create the merge commit
    let msg = format!("Merge: {} into {}", remote.id(), local.id());
    let sig = repo.signature()?;
    let local_commit = repo.find_commit(local.id())?;
    let remote_commit = repo.find_commit(remote.id())?;
    // Do our merge commit and set current branch head to that commit.
    let _merge_commit = repo.commit(
        Some("HEAD"),
        &sig,
        &sig,
        &msg,
        &result_tree,
        &[&local_commit, &remote_commit],
    )?;
    // Set working tree to match head.
    repo.checkout_head(None)?;
    Ok(())
}

fn do_merge<'a>(
    repo: &'a git2::Repository,
    remote_branch: &str,
    fetch_commit: git2::AnnotatedCommit<'a>,
) -> Result<(), git2::Error> {
    // 1. do a merge analysis
    let analysis = repo.merge_analysis(&[&fetch_commit])?;

    // 2. Do the appropriate merge
    if analysis.0.is_fast_forward() {
        println!("Doing a fast forward");
        // do a fast forward
        let refname = format!("refs/heads/{}", remote_branch);
        match repo.find_reference(&refname) {
            Ok(mut r) => {
                fast_forward(repo, &mut r, &fetch_commit)?;
            }
            Err(_) => {
                // The branch doesn't exist so just set the reference to the
                // commit directly. Usually this is because you are pulling
                // into an empty repository.
                repo.reference(
                    &refname,
                    fetch_commit.id(),
                    true,
                    &format!("Setting {} to {}", remote_branch, fetch_commit.id()),
                )?;
                repo.set_head(&refname)?;
                repo.checkout_head(Some(
                    git2::build::CheckoutBuilder::default()
                        .allow_conflicts(true)
                        .conflict_style_merge(true)
                        .force(),
                ))?;
            }
        };
    } else if analysis.0.is_normal() {
        // do a normal merge
        let head_commit = repo.reference_to_annotated_commit(&repo.head()?)?;
        normal_merge(&repo, &head_commit, &fetch_commit)?;
    } else {
        println!("Nothing to do...");
    }
    Ok(())
}