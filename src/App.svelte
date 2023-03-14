<script>
    import Uplot from "./uplot_v3.svelte";
    import Table from "./simple_table.svelte";
    import {fetch_ids, Timeout, get_sensor_list, load_calibrations, read_sensor} from "./load_cal.js";
    import MyCollapse from "./MyCollapse.svelte";
    import {merge_data} from "./merge.js";
    import Loader from "./Loader.svelte";
    let data = [
        [1546300800, 1546387200],    // x-values (timestamps)
        [        35,         15],    // y-values (series 1)
        [        90,         15],    // y-values (series 2)
    ];
    let count = 0;
    /*
    let data_ready = true;
    let table_data = [0, 1, 2];
    let labels = ['TIME', 'a', 'b'];
    let loading_id = -1;
    */ 
    import { onMount, afterUpdate } from 'svelte';
    import {linear} from 'everpolate';
    import * as lttb from 'downsample-lttb';
    import ky from 'ky';
    console.log(ky);
    
    // const module = import('got');
    // import * as got from 'got';
    // console.log('got');
    const downsample = lttb.default.processData;
    /*
    // test that lttb is working
    var dummyDataSeries = [[1,2],[2,2],[3,3],[4,3],[5,6],[6,3],[7,3],[8,5],[9,4],[10,4],[11,1],[12,2]];
    console.log(downsample(dummyDataSeries, 3));
    */
    // var data;
    var loading_id = -1;
    var last_ts = 0;
    var data_ready = false;
    var labels;
    let host = '132.163.53.82:3200';
    // let ids = [100];
    // let ids = [4, 5, 6, 7, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109];
    // let ids = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109];
    // let ids = [4, 5, 6, 7 ];
    let ids = [4, 5, 6, 7, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109];
    var cals;
    var diode_list, compressor_list, sensor_list;
    var plot_ids;
    var sensor_names;
    var table_data;
    onMount( async() => {
        var ky_test = await ky('http://132.163.53.82:3200/database/log.db/compressor_list').json()
        console.log(ky_test);
        cals = await load_calibrations(host);
        console.log('cals', cals, cals['DC2018'](0.5), cals['DT670'](0.5));
        let url = `http://${host}/database/log.db/diode_list`;
        diode_list = (await get_sensor_list(url))['data'];
        console.log('after get diode_list', diode_list);
        url = `http://${host}/database/log.db/compressor_list`;
        compressor_list = (await get_sensor_list(url))['data'];
        console.log('after get compressor_list', compressor_list);
        sensor_list = [...diode_list, ... compressor_list];
        console.log('full sensor_list', sensor_list);
        let stop_ts = Math.floor(Date.now()/1000)
        var start_ts = stop_ts - 7*86000;
        start_ts = 0
        var history_v2 = [];

        labels=['TIME'];        

        var responses = await fetch_ids(host, ids, start_ts, stop_ts);
        for (const response of responses) {
            console.log('process response');
            /* 
            // Code to timeout if json conversion fails.

            let timeout = new Timeout();
            console.time('json');
            var sensor_data = await timeout
                .wrap(response.json(), 2000, { reason: 'json timeout' })
                .then( async data => {return data['data']})
                .catch( (data)=> {console.log('catch json timeout', data.reason); })
                .finally ( ()=> {
                    timeout.clear(...timeout.ids);
                    console.timeEnd('json');
                });
            */
            // let sensor_data = (await response.json())['data'];
            
            var sensor_data = response['data'];
            console.log('sensor_data length', sensor_data.length);
            let id = sensor_data[0][1];
            loading_id = id;
            let sensor_info = sensor_list.find(elt => elt[0]==id);
            console.log('find id',id, sensor_info[3]);
            labels.push(sensor_info[1]);
            var trace; 
            let use_lttb = true;
            if (use_lttb) { 
                var points = sensor_data.map(x=>[x[0], 
                    cals[sensor_info[3]](x[2])]);
                var trace_small = downsample(points, 1000);
                trace = [trace_small.map(x=>x[0]), trace_small.map(x=>x[1])]
            } else {  
                trace = [
                    sensor_data.map(x=>x[0]),
                    cals[sensor_info[3]](sensor_data.map(x=>x[2])) 
                ];
            } 
            if (history_v2.length==0) {
                // console.log('start history_v2');
                history_v2 = trace;
            } else {
                // console.log('merge history_v2');
                history_v2 = merge_data(history_v2, trace);
            }
            console.log('end process response');
        }

        plot_ids = [...labels];
        plot_ids.shift();
        sensor_names = [...plot_ids];
        console.log('labels', labels);
        console.log('v2', history_v2);
        data_ready = true;

        last_ts = history_v2[0][history_v2[0].length-1];
        console.log('latest ts',last_ts);
        data = history_v2;
        console.log('data', data);
        var last_data = history_v2.map(x=>x[x.length-1]);
        console.log('last_data', last_data);
        table_data = last_data.map(
            (x,i)=>  (i>0) ? (Array.isArray(x) ? x[0].toFixed(2): x.toFixed(2)): (new Date(x.toFixed(0)*1000)).toLocaleString()
        );
        setInterval( append, 10000);

    });
    $: { 
        console.log('plot_ids', plot_ids);
        if (plot_ids !== undefined) {
            for (const label of plot_ids) {
                let id_list = sensor_list.find(elt => elt[1]==label)
                // console.log(id_list);
            }
        }
    }
    var appending = false;
    async function append() {
        var catchup = true;
        while (catchup & (appending==false) ) {
            console.log('on catchup appending', appending);
            appending = true;
            if (last_ts>0) {
                console.log('append, last_ts: ', last_ts);
                let new_ts = 0;
                let new_data = [];
                let bulk_url = `http://132.163.53.82:3200/database/log.db/data?start=${last_ts+1}`;
                var bulk_json = await fetch(bulk_url).then(response => response.json())
                bulk_json = bulk_json['data'];
                var bulk_ts = Array.from(new Set(bulk_json.map(x=>x[0])));
                console.log('bulk download', bulk_json.length, bulk_ts);
                for (const ts of bulk_ts) {
                    var one_ts = bulk_json.filter(x => x[0]==ts);
                    last_ts = ts;
                    // console.log(ts, one_ts);
                    if(ids.every(x => one_ts.map(x=>x[1]).includes(x))) {
                        new_data = [ts];
                        for (const id of ids) {
                            let sensor_info = sensor_list.find(elt => elt[0]==id);
                            var reading = one_ts.filter(x => x[1] == id);
                            reading = reading[0][2];
                            // console.log(id, reading);
                            reading = Array.isArray(reading) ? reading[0]: reading;
                            var converted = cals[sensor_info[3]](reading);
                            converted = Array.isArray(converted) ? converted[0]: converted;
                            new_data.push(converted);
                        }
                        console.log('bulk new_data', new_data);
                    }
                    for(var i=0; i<new_data.length; i++) {
                        data[i].push(new_data[i])
                    }
                }
                /*
                // request data for each id separately instead of bulk (above)
                new_data = [];
                for (const id of ids) {
                    var got_nothing = true;
                    while (got_nothing) {
                        // fetch all data since last_ts that was plotted
                        let url = `http://132.163.53.82:3200/database/log.db/data?id=${id}&start=${last_ts+1}`;
                        // console.log('url', url);
                        var json = await fetch(url).then(response => response.json())
                        json = json['data'];
                        // console.log('json', json);
                        got_nothing = json.length==0;
                    } 
                    console.log(id, json, last_ts);
                    if (json.length==1) catchup = false;

                    // only add one timestamp of data even if there is more
                    if ((json.length>0) & (new_ts==0)) {
                        new_ts = json[0][0];
                        console.log('new_ts to add', json[0][0]);
                        new_data.push(new_ts);
                    }
                    if (json.length>0) {
                        let sensor_info = sensor_list.find(elt => elt[0]==id);
                        new_data.push(cals[sensor_info[3]](json[0][2]));
                    }
                }
                if (new_ts>0) last_ts = new_ts;
                console.log('new_data', new_data);

                for(var i=0; i<new_data.length; i++) {
                    data[i].push(new_data[i])
                }
                */
                data=data;
                // table_data = new_data; 
                table_data = new_data.map(
                    // (x,i)=>  (i>0) ? x[0].toFixed(2) : (new Date(x.toFixed(0)*1000)).toLocaleString()
                    (x,i)=>  (i>0) ? (Array.isArray(x) ? x[0].toFixed(2): x.toFixed(2)): (new Date(x.toFixed(0)*1000)).toLocaleString()
                );
                console.log('table_data', table_data); 
                // console.log('data size', data.length, data[0].length);
            } 
            appending = false;
            catchup = false;
        }

    }
    // setInterval( append, 10000);
     
    /* function append() { */
    /*     data_ready = true; */
    /*     //apppend value to end of each array via push */
    /*     for(var i=0; i<data.length; i++) { */
    /*         if(i==0) { */
    /*             /1* data[i].push(1546387200 + 1000*count); *1/ */
    /*             data[i].push(new Date().getTime()/1000 ); */
    /*             count++; */
    /*         } else { */
    /*             data[i].push(100*Math.random()) */	
    /*         } */
    /*     } */
    /*     data=data; */
    /* } */

    /* setInterval( append, 10000); */ 
</script>

        <body>
<style>

    .sidebar {
        height: 200px;
        width: 175px;
        position: fixed;
        top: 0;
        left: 0;
        padding-top: 40px;
        /* background-color: lightblue; */
    }

    .sidebar div {
        padding: 8px;
        font-size: 16px;
        display: block;
    }
    .body-text {
        margin-left: 175px;
        font-size: 18px;
    }
</style>
<div class="sidebar">
    {#if data_ready}
    <Table table_data={table_data} labels={labels}/>
    <!--
    <MyCollapse label={'plot'} bind:choices={plot_ids} menu={sensor_names}/>
    -->
    {/if}
</div>

<div class="body-text">
    {#if data_ready}
        <Uplot data={data} labels={labels}/>
    {:else}
        <Loader loading={!data_ready}/>
    {/if}
</div>

        </body>
