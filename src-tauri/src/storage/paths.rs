//! Single source of truth for the on-disk folder/file layout of a project.

use std::path::{Path, PathBuf};

pub const PROJECT_MANIFEST: &str = "worldbuilder.json";
pub const TEMPLATES_DIR: &str = "templates";
pub const ENTRIES_DIR: &str = "entries";
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

    pub fn manifest(&self) -> PathBuf {
        self.root.join(PROJECT_MANIFEST)
    }

    pub fn templates_dir(&self) -> PathBuf {
        self.root.join(TEMPLATES_DIR)
    }

    pub fn entries_dir(&self) -> PathBuf {
        self.root.join(ENTRIES_DIR)
    }

    pub fn images_dir(&self) -> PathBuf {
        self.root.join(ASSETS_DIR).join(IMAGES_DIR)
    }

    pub fn template_file(&self, id: &str) -> PathBuf {
        self.templates_dir().join(format!("{id}.json"))
    }

    pub fn entry_file(&self, id: &str) -> PathBuf {
        self.entries_dir().join(format!("{id}.json"))
    }
}
