import chai, {expect}	from "chai"
import React			from 'react'
import equalJSX			from 'chai-equal-jsx'

import ReactTestUtils, {createRenderer}	from 'react-addons-test-utils'

import App					from '../src/client/containers/App'
import Mobile,
	{ clickLeft, parseUrl }	from '../src/client/containers/Mobile'
import {Format}				from '../src/client/containers/Format'

import {Header}				from '../src/client/components/header'
import {NextPiece}			from '../src/client/components/NextPiece'
import {Col}				from '../src/client/components/Col'
import {Chatbox}			from '../src/client/components/chatbox'

const assert = require('chai').assert

chai.should()
chai.use(equalJSX)

const col = [
	'case', 'case', 'case', 'case', 'case', 'case', 'case', 'case', 'case', 'case',
	'case', 'case', 'case', 'case', 'case', 'case', 'case', 'case', 'case', 'case',
];

const nextPiece = {
	b: [
		[0, 0, 0],
		[0, 1, 1],
		[1, 1, 0],
	],
	color: 'grn'
};

describe('Col', () => {

	it ('should render Col', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<Col value={col} />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type, 'div')
		done()
	})

	it ('should render Col with malus', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<Col value={col} malus={2} />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type, 'div')
		done()
	})

})

describe('NextPiece', () => {

	it ('should be ok PLEASE', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<NextPiece value={nextPiece} />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type, 'div')
		done()
	})
	it ('should render a div', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<NextPiece value={[]} />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type, 'div')
		done()
	})
	it ('should fail before render', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<NextPiece />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type, 'div')
		done()
	})
})

describe('Header', () => {

	it ('should be ok PLEASE', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<Header value={col} />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type, 'div')
		done()
	})
})

describe('Chatbox', () => {

	it ('should be ok PLEASE', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<Chatbox messages={[]} />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type, 'div')
		done()
	})
	it ('should be ok PLEASE', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<Chatbox messages={[{from: 'x', text: 'ewfe'}]} />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type, 'div')
		done()
	})
})

describe('Mobile', () => {
	before(() => {
		global.window = {location: {href: 'http://localhost:8080/#(mobile)test[test]'}}
	})
	it ('should be ok PLEASE', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<Mobile />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type, 'div')
		done()
	})
	it ('should be ok PLEASE', done => {
		clickLeft();
		done();
	})
	it ('should be ok PLEASE', done => {
		parseUrl();
		done();
	})
})

describe('Index', () => {
	before(() => {
		global.window = {location: {hash: '#(mobile)test[test]'}}
	})
	it ('should be ok PLEASE', done => {
		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<Format />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type,Mobile)
		done()
	})
	it ('should be ok PLEASE', done => {
		global.window = {location: {hash: '#test[test]'}}

		const createdRender = ReactTestUtils.createRenderer();
		createdRender.render(<Format />);

		const output = createdRender.getRenderOutput();
		assert.equal(output.type,App)

		done()
	})
})
