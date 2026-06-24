import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { healthHandler } from '../src/controllers/health.controller.js';

describe('Health controller', () => {
	test('should return 200 with success payload', () => {
		const req = {};
		const res = {
			statusCode: null,
			body: null,
			status(code) {
				this.statusCode = code;
				return this;
			},
			json(payload) {
				this.body = payload;
				return this;
			},
		};

		healthHandler(req, res);

		assert.equal(res.statusCode, 200);
		assert.deepEqual(res.body, {
			success: true,
			message: 'API funcionando correctamente',
		});
	});
});
