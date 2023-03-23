import {linear} from 'everpolate';
import ky from 'ky';
// import got from 'got';
// console.log('got', got);
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
        'RO600': await build_cal('RO600'),
        'RuO2Mean': await build_cal('RuO2Mean'),
        'ROX6951': await build_cal('ROX6951'),
        'None': none,
        'none': none};
    return cal 
}

export async function get_sensor_list(url) {
    var list = await fetch(url);
    list = await list.json();
    // console.log('diode_list', list); 
    return list;
}

function timeoutAfter(seconds) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("request timed-out"));
    }, seconds * 1000);
  });
}

export async function read_sensor(host, id, start_ts=0) {
    let url = `http://${host}/database/log.db/data?id=${id}&start=${start_ts}`;
    // var response = await fetch(url); 
    // var json = await response.json(); 
    try {
        // console.log('start race');
        console.time('race');
        var response = await Promise.race(
            [fetch(url), timeoutAfter(2)]
        ); 
        //console.log('end race');
        console.timeEnd('race');
        var json = await response.json(); 
        return json['data']
    } catch (error) {
        console.log('read_sensor error');
        console.log(error.message);
        console.timeEnd('race');
        return [];
    }
}
export class Timeout {
    constructor() {
        this.ids = [];
    }

    set = (delay, reason) =>
        new Promise((resolve, reject) => {
            const id = setTimeout(() => {
                if (reason === undefined) resolve();
                else reject(reason);
                this.clear(id);
            }, delay);
            this.ids.push(id);
        });

    wrap = (promise, delay, reason) =>
        Promise.race([promise, this.set(delay, reason)]);

    clear = (...ids) => {
        this.ids = this.ids.filter(id => {
            if (ids.includes(id)) {
                clearTimeout(id);
                return false;
            }
            return true;
        });
    };
}

export async function fetch_timeout(url, wait=3000) {
    const timeout = new Timeout();
    console.log('start fetch');
    console.time(`fetch ${url}`); 
    var dd = await timeout
        // .wrap(fetch(url), wait, {
        .wrap(ky(url), wait, {
            reason: 'Fetch timeout',
        })
        .then(async data => {
            return data;
        })
        .finally(() => {
            timeout.clear(...timeout.ids)
            console.timeEnd(`fetch ${url}`);
        });
    return dd;
}

export async function fetch_ids(host, ids, html_elt, start_ts=0, stop_ts=0, wait=3000) {
    console.log('fetch_ids', host, ids, start_ts);
    var responses=[];
    for (const id of ids) {
        // let url = `http://132.163.53.82:3200/database/log.db/data?id=${id}`;
        let url = `http://${host}/database/log.db/data?id=${id}&start=${start_ts}&stop=${stop_ts}`;
        html_elt.innerHTML = 'loading id: '+id
        // console.log(url);
        var tries = 0;
        var keep_trying = true;
        while ((keep_trying) & (tries<5)) {
            keep_trying = false;
            var response = await fetch_timeout(url, wait).catch(data => {
                console.log('timeout_fetch catch', data);
                keep_trying = true;
            });
            ++tries;
        }
        console.log(id,  'tries', tries);
        // responses.push(response);
        responses.push( await response.json())
        console.log('pushed json');
    }
    return responses
}
