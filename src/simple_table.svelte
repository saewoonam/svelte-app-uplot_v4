<script>
	export let table_data = ["today", 1, 2];
	export let labels = [100, 101];
    export let colors = ['red', 'blue', 'green'];
</script>
<style>
    table {
        border: 1px solid;
    }
    th, td {
        padding: 5px;
        text-align: center;
        border: 1px solid;
    }
    table thead {border: 1px solid; display: block;}
    table tbody {height:600px; overflow-y:scroll; display:block;}

</style>
{#if table_data.length>0}
{table_data[0]}
{/if}
<table>
	<tr>
		<th>ID </th>
		<th>reading</th>
	</tr>
	{#each table_data as reading,i}
	{#if i>0}
	<tr>
        <td style="color:{colors[(i-1)%colors.length]}"> {labels[i]} </td>
		<td> {reading} </td>
	</tr>
	{/if}
	{/each}
</table>


