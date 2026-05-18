//! Single source of truth for the on-disk folder/file layout of a project.

use std::path::{Path, PathBuf};

pub const PROJECT_DB_FILE: &str = "project.db";
pub const ASSETS_DIR: &str = "assets";
pub const IMAGES_DIR: &str = "images";

/// Resolves all known paths under a given project root.
pub struct ProjectPaths {
    root: PathBuf,
}

impl ProjectPaths {
    pub fn new(root: impl Into<PathBuf>) -> Self {
        Self { root: root.into() }
    }

    pub fn root(&self) -> &Path {
        &self.root
    }

    pub fn project_db(&self) -> PathBuf {
        self.root.join(PROJECT_DB_FILE)
    }

    pub fn images_dir(&self) -> PathBuf {
        self.root.join(ASSETS_DIR).join(IMAGES_DIR)
    }
}
