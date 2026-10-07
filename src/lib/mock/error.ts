/** An HTTP-shaped failure: the message is user-facing, the status is the contract. */
export class MockHttpError extends Error {
  readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = "MockHttpError";
    this.status = status;
  }
}
