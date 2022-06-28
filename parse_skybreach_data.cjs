// 0x992274b1 ("Smart Buy with Credits")
// 0x450d996a ("Buy Plots") https://moonriver.moonscan.io/txs?block=2102711

function convert_raw_decimal_to_x_y_tuple(num) {
    let y = Math.floor(num / 256);
    let x = num - (y * 256);
    return [x, y];
}

module.exports.parse = function parse_data(data) {
    let method = data.slice(0, 10);
    data = data.slice(10);

    if (method == "0x992274b1") {
        let a = data.slice(0, 64);
        data = data.slice(64);
    }

    let b = data.slice(0, 64);
    data = data.slice(64);

    let c = data.slice(0, 64);
    data = data.slice(64);

    let d = data.slice(0, 64);
    data = data.slice(64);

    let e = data.slice(0, 64);
    data = data.slice(64);

    let count_raw = data.slice(0, 64);
    data = data.slice(64);
    let count = parseInt(count_raw.replace(/^0/, ''));

    let lands = [];

    for (var i = 0; i < count; i++) {
        let land_raw = data.slice(0, 64);
        let l = parseInt(land_raw, 16);
        let location = convert_raw_decimal_to_x_y_tuple(l);
        lands.push(convert_raw_decimal_to_x_y_tuple(l));
        data = data.slice(64);
    }
    let statement = `(${lands.join("), (")})`;
    return statement;

}


module.exports.extract_coordinates_from_topic = function extract_coordinates_from_topic(data) {
    let b = data.slice(0, 66);
    data = data.slice(66);

    let count_raw = data.slice(0, 64);
    data = data.slice(64);
    let count = parseInt(count_raw.replace(/^0/, ''));

    let lands = [];
    for (var i = 0; i < count; i++) {
        let land_raw = data.slice(0, 64);
        let l = parseInt(land_raw, 16);
        let location = convert_raw_decimal_to_x_y_tuple(l);
        lands.push(convert_raw_decimal_to_x_y_tuple(l));
        data = data.slice(64);
    }
    let statement = `(${lands.join("), (")})`;
    return statement;

}


