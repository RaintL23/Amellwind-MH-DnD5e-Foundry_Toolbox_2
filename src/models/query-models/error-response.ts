export default class ErrrorResponse {
  public status: number;
  public title: string;
  public detail?: string;
  public errors?: Record<string, string[]>;
  public traceId?: string;
  public type?: string;

  constructor(status: number, title: string) {
    this.status = status;
    this.title = title;
  }
}
