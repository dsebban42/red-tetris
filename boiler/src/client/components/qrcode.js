import React, { Component } from 'react';

class QrCode extends Component {

	render() {
		const { addr } = this.props;

		return (
			<div className="qrcode">
				<img src={'https://api.qrserver.com/v1/create-qr-code/?data=' + addr} alt=""  />
			</div>
		);
	}
}

export default QrCode;
