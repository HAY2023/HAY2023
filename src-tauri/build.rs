fn main() {
    // Windows manifest configuration
    #[cfg(target_os = "windows")]
    {
        windows_build_config();
    }
    
    tauri_build::build()
}

#[cfg(target_os = "windows")]
fn windows_build_config() {
    // Embed manifest file
    #[cfg(target_os = "windows")]
    {
        if std::path::Path::new("app.manifest").exists() {
            println!("cargo:rustc-env=MANIFEST_FILE=app.manifest");
        }
    }
}
