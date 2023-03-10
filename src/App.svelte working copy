<script>
    import Uplot from "./uplot_v3.svelte";
    import Table from "./simple_table.svelte";
    import {get_sensor_list, load_calibrations, read_sensor} from "./load_cal.js";
    import MyCollapse from "./MyCollapse.svelte";
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
    // var data;
    var loading_id = -1;
    var last_ts = 0;
    var data_ready = false;
    var labels;
    let host = '132.163.53.82:3200';
    // let ids = [100];
    let ids = [100, 101, 102, 103, 104, 105, 106, 107, 108, 109];
    // let ids = [4, 5, 6, 7];
    var cals;
    var diode_list;
    var plot_ids;
    var sensor_names;
    onMount( async() => {
        cals = await load_calibrations(host);
        console.log('cals', cals, cals['DC2018'](0.5), cals['DT670'](0.5));
        let url = `http://${host}/database/log.db/diode_list`;
        diode_list = (await get_sensor_list(url))['data'];
        console.log('after get', diode_list);
        var history;
        let start_ts = -3*86000;
        let sensor_data = await read_sensor(host, ids[0], start_ts);

        history = [
            sensor_data.map(x=>x[0])
        ];
        console.log('timestamps', history);
        labels=['TIME'];        

        for (const id of ids) { 
            loading_id = id;
            let sensor_data = await read_sensor(host, id, start_ts);
            let sensor_info = diode_list.find(elt => elt[0]==id);
            console.log('find id',id, sensor_info[3]);
            history.push( cals[sensor_info[3]](sensor_data.map(x=>x[2])) );
            labels.push(sensor_info[1]);
        }
        plot_ids = [...labels];
        plot_ids.shift();
        sensor_names = [...plot_ids];
        console.log('labels', labels);
        console.log(history);
        data_ready = true;

        last_ts = history[0][history[0].length-1];
        console.log('latest ts',last_ts);
        data = history;
        console.log('data', data);

    });
    var table_data;
    $: { 
        console.log(plot_ids);
        if (plot_ids !== undefined) {
            for (const label of plot_ids) {
                let id_list = diode_list.find(elt => elt[1]==label)
                console.log(id_list);
            }
        }
    }
    async function append() {
        var catchup = true;
        while (catchup) {
            if (last_ts>0) {
                catchup = false;
                // let ids = [100, 108];
                // console.log('append, last_ts: ', last_ts);
                let new_ts = 0;
                let new_data = [];
                // new_data = [];
                for (const id of ids) {
                    // fetch all data since last_ts that was plotted
                    let url = `http://132.163.53.82:3200/database/log.db/data?id=${id}&start=${last_ts+1}`;
                    // console.log('url', url);
                    var json = await fetch(url).then(response => response.json()).then(res=>res['data']);
                    console.log(id, json, last_ts);

                    // only add one timestamp of data even if there is more
                    if ((json.length>0) & (new_ts==0)) {
                        new_ts = json[0][0];
                        console.log('new_ts to add', json[0][0]);
                        new_data.push(new_ts);
                    }
                    if (json.length>0) {
                        let sensor_info = diode_list.find(elt => elt[0]==id);
                        new_data.push(cals[sensor_info[3]](json[0][2]));
                    }
                }
                if (new_ts>0) last_ts = new_ts;
                console.log('new_data', new_data);

                for(var i=0; i<new_data.length; i++) {
                    data[i].push(new_data[i])
                }
                data=data;
                // table_data = new_data; 
                table_data = new_data.map(
                    // (x,i)=>  (i>0) ? x[0].toFixed(2) : (new Date(x.toFixed(0)*1000)).toLocaleString()
                    (x,i)=>  (i>0) ? x[0].toFixed(2): (new Date(x.toFixed(0)*1000)).toLocaleString()
                );
                console.log('table_data', table_data); 
                // console.log('data size', data.length, data[0].length);
            } 
        }
    }
    setInterval( append, 10000);
     
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
        loading, {loading_id}
    {/if}
</div>

        </body>
