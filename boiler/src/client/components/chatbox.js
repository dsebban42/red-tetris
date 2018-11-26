import React from 'react'

export const Chatbox = (props) => {
	let messages

	messages = props.messages || [];

	return (
		<div>
			{messages && messages.map((value, key) => {
				return (
					<div key={key}><span style={{float: 'left'}}>{value.from}:</span> {value.text}</div>
				)
			  })}
		</div>
	)
}
