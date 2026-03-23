const { API_BASE_URL } = require("../config");

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${API_BASE_URL}${path}`,
      method: options.method || "GET",
      data: options.data,
      header: {
        "Content-Type": "application/json",
        ...(options.header || {}),
      },
      success(response) {
        const { statusCode, data } = response;

        if (statusCode >= 200 && statusCode < 300) {
          resolve(data);
          return;
        }

        reject(new Error((data && data.message) || `请求失败：${statusCode}`));
      },
      fail(error) {
        reject(error);
      },
    });
  });
}

module.exports = {
  request,
};
