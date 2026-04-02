const axios = require('axios');
const FormData = require('form-data');

async function testSubmit() {
  try {
    const fd = new FormData();
    fd.append('requestType', 'LEAVE');
    fd.append('leaveCategory', 'PERSONAL');
    fd.append('fromDate', '2026-04-02');
    fd.append('toDate', '2026-04-02');
    fd.append('reason', 'sdfg');

    // Make request without strict Content-Type to let form-data module handle boundary
    const res1 = await axios.post('http://localhost:8080/api/leave/request', fd, {
      headers: fd.getHeaders()
    });
    console.log("Success with boundary:", res1.status);
  } catch (err) {
    console.error("Error with boundary:", err.response ? err.response.status : err.message);
  }

  try {
    const fd2 = new FormData();
    fd2.append('requestType', 'LEAVE');
    fd2.append('leaveCategory', 'PERSONAL');
    fd2.append('fromDate', '2026-04-02');
    fd2.append('toDate', '2026-04-02');
    fd2.append('reason', 'sdfg');

    // Make request mimicking frontend exact header
    const res2 = await axios.post('http://localhost:8080/api/leave/request', fd2, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    console.log("Success WITHOUT boundary:", res2.status);
  } catch (err) {
    console.error("Error WITHOUT boundary:", err.response ? err.response.status : err.message);
    if(err.response) console.error("Body:", err.response.data);
  }
}

testSubmit();
