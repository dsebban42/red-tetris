import React from 'react'

export const NextPiece = (props) => {
	const next = props.value;
	
	return (
		<div className="nextpiece">
			{next && next.b && next.b.map((value, key) => {
 				return (
 					<div className="col" key={key}>
		 				<div className={value[0] ? 'case bg-'+next.color : 'case'}></div>
					 	<div className={value[1] ? 'case bg-'+next.color : 'case'}></div>
					 	<div className={value[2] ? 'case bg-'+next.color : 'case'}></div>
					 	<div className={value[3] ? 'case bg-'+next.color : 'case'}></div>
 					</div>
 				)
	 		})}
		</div>
	)
}
