<script>
	import { onMount, afterUpdate } from 'svelte';
  import {data_config, opts_config, colors} from './uplot_v3_config.js'
	import SvgIcon from './SvgIcon.svelte'
  import {bellIcon, download, home, png} from './AppIcons'
	// import html2canvas from 'html2canvas';
	// import uPlot from 'uplot'; // use async away import below so it works in sapper
	import filesaver from 'file-saver';
	export let data = data_config;
  export let opts = opts_config;
	let plotDiv;
	let uPlot;
	let uplot;
	let htmlcanvas;
	let autox = true;
	let autoy = true;
	// console.log(opts)
  let y_range;
	opts.scales.x.auto = ()=> {return autox}
	opts.scales.y.auto = ()=> {return autoy}
	//console.log(opts.scales.y.range);
	opts.scales.x.range = (self, min, max) => {return [min, max]}
	opts.scales.y.range = (self, min, max) => {
 		if (!autoy) {
 				y_range = [0, 300];
 		} else {
			y_range = [min, max];
		}
		// console.log('y', y_range)
		return y_range;
	}
	let s = [{}]
	for (let i=0; i<data.length-1; i++) {
		s.push({
			spanGaps: true,
			label: "y"+i,
			stroke: colors[9-i],
			width: 2
		})
	}
	opts.series = s;
	opts.cursor.bind.dblclick = (u, targ, handler) => {
            	return e => {
                console.log('in dblclick')
								autox = true;
								autoy= true;
                handler(e)              
            	} 
	}
	opts.cursor.bind.mousemove = (u, targ, handler) => {
		return e => {
			if (e.buttons==1) {
				 autox = false;
				 autoy = false;
				 // console.log(e)
         // console.log('mousemove button', e.button, 'buttons', e.buttons);
			}
			handler(e)
		}
	}
	onMount(async () => {
	  console.log("onMount")
		const module = await import ('uplot');
    uPlot = module.default;
		uplot = new uPlot(opts,data,plotDiv);
		const m = await import ('html2canvas');
		//console.log(m.default)
		html2canvas = m.default;
		console.log(html2canvas)
  });
	afterUpdate( ()=> {
		if(uplot && autox && autoy) {
			uplot.setData(data, true);
		} else if(uplot) uplot.setData(data, false);
	})
	function toggle_autox() {
		console.log('autox: ', autox);
		autox = !autox;
	}
	function toggle_autoy() {
		autoy = !autoy;
	}
	function resetAxis() {
		autox = true;
		autoy = true;
		uplot.setData(data)
	}
	function click() {
		console.log('click');
	}
	function saveCanvas()  {
    var canvas = document.querySelector(".u-wrap > canvas:nth-child(2)");
		console.log("canvas", canvas)
    canvas.toBlob(function(blob) {
      filesaver.saveAs(blob, "uplot.png");
    });
  }
	function saveCanvas2() {
			html2canvas(document.querySelector("#uplot")).then(canvas => {
					document.body.appendChild(canvas)
			});
	}
</script>

<link rel="stylesheet" href="https://leeoniya.github.io/uPlot/dist/uPlot.min.css">
<button on:click={resetAxis}>
  <SvgIcon d={home} />
</button>
<button on:click={saveCanvas2}>
 <SvgIcon d={png} />
</button>
<div bind:this={plotDiv}></div>

