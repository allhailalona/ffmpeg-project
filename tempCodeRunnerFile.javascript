const arr = [
	{
		color: 'red', 
		metadata:
			{
				orientation: 'gay', 
				love: 'none'
			}
	},
]

const wait = Object.entries(arr[0].metadata)
wait.map(([key, value]) => {
	console.log(key)
})