import React	from 'react';
import Mobile from './Mobile';
import App from './App';

export const Format = (props) => {

	let mobile = window.location.hash.match('mobile')

	if (mobile)
		return ( <Mobile /> )
	return ( <App /> )
}
