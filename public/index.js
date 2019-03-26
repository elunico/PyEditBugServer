// thank you MDN
function hexString(buffer) {
  const byteArray = new Uint8Array(buffer);

  const hexCodes = [...byteArray].map(value => {
    const hexCode = value.toString(16);
    const paddedHexCode = hexCode.padStart(2, '0');
    return paddedHexCode;
  });

  return hexCodes.join('');
}

function tryCred() {
  let phrase = $('#passphrase').val();
  console.log(phrase);
  const encoder = new TextEncoder();
  const data = encoder.encode(phrase);
  let d = crypto.subtle.digest('SHA-256', data);
  d.then((value) => {
    let form =
        $('<form hidden action="cred" method="post">' +
          '<input type="text" name="passphrase" value="' + hexString(value) +
          '" />' +
          '</form>')
    $('body').append(form);
    form.submit();
  });
}