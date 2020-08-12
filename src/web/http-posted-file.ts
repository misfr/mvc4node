/** 
 * HTTP posted file
 * @author Frederic BAYLE
 */
export class HttpPostedFile {
  /**
   * Posted file content type
   */
  public contentType: string;

  /**
   * Posted file data
   */
  public data: Buffer;

  /**
   * Posted file name
   */
  public fileName: string;

  /**
   * Class constructor
   * @param fileName   File name
   * @param data       File content
   */
  constructor(fileName: string, data: Buffer) {
    this.contentType = "application/octet-stream";
    this.data = data;
    this.fileName = fileName;
  }

  /**
   * Get the posted file size
   * @returns Posted file size
   */
  public get fileSize(): number { return this.data.length };
}
