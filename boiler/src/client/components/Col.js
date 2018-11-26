import React from 'react'

export const Col = (props) => {
	const col = props.value;

	return (
		<div>
			{col && col.map((value, key) => {
				if (key + props.malus >= 20)
					return (<div key={key} className='x case' style={{backgroundImage: "url('https://image.noelshack.com/fichiers/2018/05/4/1517483768-protected.png')"}} x={key} y={props.y}></div>)
				else
					return (<div key={key} className={value} x={key} y={props.y}></div>)
			})}
		</div>
	)
}
