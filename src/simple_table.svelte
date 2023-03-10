<script>
	export let table_data = ["today", 1, 2];
	export let labels = [100, 101];
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
		<td> {labels[i]} </td>
		<td> {reading} </td>
	</tr>
	{/if}
	{/each}
</table>

