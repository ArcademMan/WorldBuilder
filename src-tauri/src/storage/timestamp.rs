//! ISO 8601 timestamp helper. Single source of truth so all stores
//! produce identically formatted strings.

use time::format_description::well_known::Iso8601;
use time::OffsetDateTime;

pub fn now_iso() -> String {
    OffsetDateTime::now_utc()
        .format(&Iso8601::DEFAULT)
        .unwrap_or_else(|_| String::from("1970-01-01T00:00:00.000000000Z"))
}
