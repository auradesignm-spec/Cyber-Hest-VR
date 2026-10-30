/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hexToPort,
  validatePortShot,
  generateScenario1,
  validateCountermeasure,
  generateScenario2,
  validateSubnetShot,
  generateScenario3,
  HEX_PORT_TABLE,
  PAYLOAD_RULES,
  SUBNET_RULES,
} from './rules';

test('Scenario 1: hexToPort correctly decodes hexadecimal strings', () => {
  assert.equal(hexToPort('0x16'), 22);
  assert.equal(hexToPort('0x50'), 80);
  assert.equal(hexToPort('0x1BB'), 443);
  assert.equal(hexToPort('0x15'), 21);
  assert.equal(hexToPort('0x35'), 53);
});

test('Scenario 1: validatePortShot checks correct and incorrect port matches', () => {
  assert.equal(validatePortShot('0x16', 22), true);
  assert.equal(validatePortShot('0x16', 80), false);
  assert.equal(validatePortShot('0x1BB', 443), true);
  assert.equal(validatePortShot('0x1BB', 22), false);
});

test('Scenario 1: generateScenario1 produces valid target and candidate ports', () => {
  const scenario = generateScenario1(0); // target 0x16 -> 22
  assert.equal(scenario.targetHex, '0x16');
  assert.equal(scenario.correctPort, 22);
  assert.equal(scenario.serviceName, 'SSH');
  assert.ok(scenario.allPortOptions.includes(22), 'Must include the correct port');
  assert.ok(scenario.allPortOptions.length >= 4, 'Must provide multiple candidate options');
});

test('Scenario 2: validateCountermeasure matches case-insensitive shield IDs', () => {
  assert.equal(validateCountermeasure('AES-256', 'aes-256'), true);
  assert.equal(validateCountermeasure('RSA-4096', 'RSA-4096'), true);
  assert.equal(validateCountermeasure('AES-256', 'SHA-512'), false);
});

test('Scenario 2: generateScenario2 provides 3-color sequence and matching shield', () => {
  const scenario = generateScenario2(0); // ['red', 'blue', 'green'] -> 'AES-256'
  assert.deepEqual(scenario.colorSequence, ['red', 'blue', 'green']);
  assert.equal(scenario.correctShield, 'AES-256');
  assert.ok(scenario.availableShields.length >= 3);
});

test('Scenario 3: validateSubnetShot checks correct and incorrect node targets', () => {
  assert.equal(validateSubnetShot('GAMMA', 'GAMMA'), true);
  assert.equal(validateSubnetShot('GAMMA', 'gamma'), true);
  assert.equal(validateSubnetShot('GAMMA', 'ALPHA'), false);
  assert.equal(validateSubnetShot('ALPHA', 'ALPHA'), true);
  assert.equal(validateSubnetShot('BETA', 'BETA'), true);
});

test('Scenario 3: generateScenario3 provides IP and target Subnet Core Node', () => {
  const scenario = generateScenario3(0); // 192.168.4.50 -> GAMMA
  assert.equal(scenario.attackingIp, '192.168.4.50');
  assert.equal(scenario.targetSubnetCidr, '192.168.4.0/24');
  assert.equal(scenario.correctNodeId, 'GAMMA');
  assert.equal(scenario.nodes.length, 3);
});

test('Rule definitions integrity', () => {
  assert.ok(HEX_PORT_TABLE.length >= 6);
  assert.ok(PAYLOAD_RULES.length >= 4);
  assert.ok(SUBNET_RULES.length >= 3);
});
