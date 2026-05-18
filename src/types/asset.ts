export type Asset = {
  id: string;
  mimeType: string;
  originalFilename: string;
  byteSize: number;
  createdAt: string;
};

/** Wire shape of read_asset — `bytes` arrives as number[] then is wrapped. */
export type AssetData = {
  mimeType: string;
  bytes: number[];
};
