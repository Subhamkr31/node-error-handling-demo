class SuccessResponse {
  constructor(data, message = 'Operation successful', statusCode = 200) {
    this.status = 'success';
    this.message = message;
    this.data = data;
    this.statusCode = statusCode;
  }

  send(res) {
    return res.status(this.statusCode).json({
      status: this.status,
      message: this.message,
      data: this.data
    });
  }
}

module.exports = SuccessResponse; 