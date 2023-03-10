import {linear} from 'everpolate';

export async function load_calibrations(host) {
    let calibration_url_prefix = `http://${host}/database/calibration.db/`;
    /*
    let cal_name = 'DC2018'
    var list = await fetch(`${calibration_url_prefix}${cal_name}`);
    list = await list.json();
    let T = list['data'].map(x=>x[0]);
    let V = list['data'].map(x=>x[1]);
    */
    async function build_cal(cal_name) {
        var list = await fetch(`${calibration_url_prefix}${cal_name}`);
        list = await list.json();
        let T = list['data'].map(x=>x[0]);
        let V = list['data'].map(x=>x[1]);
        var cal_function = (x) => {return linear(x, V, T).map((x)=> (x>0) ? x : null)}
        return cal_function
    }

    // var DC2018 = (x) => {return linear(x, V, T).map((x)=> (x>0) ? x : null)}
    var DC2018 = await build_cal('DC2018');
    var none = (x) => {return x}
    // console.log(cal_name, DC2018(0.5));
    var cal = {
        'DC2018': await build_cal('DC2018'),
        'DT670': await build_cal('DT670'),
        'none': none};
    return cal 
}

export async function get_sensor_list(url) {
    var list = await fetch(url);
    list = await list.json();
    console.log('diode_list', list); 
    return list;
}

export async function read_sensor(host, id, start_ts=0) {
    let url = `http://${host}/database/log.db/data?id=${id}&start=${start_ts}`;
    var response = await fetch(url); 
    var json = await response.json(); 
    return json['data']
}

