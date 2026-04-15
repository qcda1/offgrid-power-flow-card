/* eslint-disable @typescript-eslint/no-explicit-any */
import { html, svg } from 'lit';
import { sunsynkPowerFlowCardConfig } from '../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function num(hass: any, entityId?: string): number {
	if (!entityId || entityId === 'none') return 0;
	const v = parseFloat(hass?.states?.[entityId]?.state);
	return isNaN(v) ? 0 : v;
}
function txt(hass: any, entityId?: string): string {
	if (!entityId || entityId === 'none') return '';
	return hass?.states?.[entityId]?.state ?? '';
}
function fmt(w: number, auto = true): string {
	if (auto && Math.abs(w) >= 1000) return `${(w / 1000).toFixed(1)} kW`;
	return `${Math.round(w)} W`;
}
function fmtV(v: number): string {
	return v > 0 ? `${v.toFixed(1)} V` : '—';
}
function fmtA(a: number): string {
	return a !== 0 ? `${Math.abs(a).toFixed(1)} A` : '—';
}
function fmtE(k: number): string {
	return `${k.toFixed(2)} kWh`;
}
function fmtHz(f: number): string {
	return f > 0 ? `${f.toFixed(1)} Hz` : '—';
}

// Ligne animée
function flowLine(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	power: number,
	colour: string,
) {
	const abs = Math.abs(power);
	if (abs < 5)
		return svg`<line x1=${x1} y1=${y1} x2=${x2} y2=${y2}
		stroke=${colour} stroke-width="1.5" opacity="0.2"/>`;
	const ms = Math.round(2000 - Math.min(abs / 5000, 1) * 1600);
	const cls = power > 0 ? 'og-fwd' : 'og-rev';
	return svg`<line x1=${x1} y1=${y1} x2=${x2} y2=${y2}
		stroke=${colour} stroke-width="2" stroke-dasharray="8 4"
		style="--og-ms:${ms}ms" class=${cls}/>`;
}

// Chemin en L avec coin arrondi : descend de (x1,y1), tourne à mi-chemin, arrive en (x2,y2)
// Utilisé pour CC → Solar
function flowElbow(
	x1: number,
	y1: number,
	x2: number,
	y2: number,
	power: number,
	colour: string,
) {
	const abs = Math.abs(power);
	const r = 12; // rayon du coin arrondi
	const midY = y1 + (y2 - y1) * 0.55;
	const goRight = x2 > x1;
	// Descend verticalement, puis tourne horizontalement vers Solar
	const d = goRight
		? `M${x1},${y1} L${x1},${midY - r} Q${x1},${midY} ${x1 + r},${midY} L${x2 - r},${midY} Q${x2},${midY} ${x2},${midY + r} L${x2},${y2}`
		: `M${x1},${y1} L${x1},${midY - r} Q${x1},${midY} ${x1 - r},${midY} L${x2 + r},${midY} Q${x2},${midY} ${x2},${midY + r} L${x2},${y2}`;
	if (abs < 5)
		return svg`<path d=${d} fill="none"
		stroke=${colour} stroke-width="1.5" opacity="0.2"/>`;
	const ms = Math.round(2000 - Math.min(abs / 5000, 1) * 1600);
	const cls = power > 0 ? 'og-fwd' : 'og-rev';
	return svg`<path d=${d} fill="none"
		stroke=${colour} stroke-width="2" stroke-dasharray="8 4"
		style="--og-ms:${ms}ms" class=${cls}/>`;
}

// ─── Layout ───────────────────────────────────────────────────────────────────

const VB_W = 620;
const VB_H = 480;

// Bus bar
const BUS_X = 20;
const BUS_Y = 215;
const BUS_W = 460;
const BUS_H = 10;
const BUS_MID = BUS_X + BUS_W / 2;

// CC boxes (rang haut)
const CC_W = 125;
const CC_H = 75;
const CC_Y = 20;
const CC_GAP = 15;

// Solar box (agrégée, centrée sur bus bar)
const SOL_W = 115;
const SOL_H = 45;
const SOL_X = BUS_MID - SOL_W / 2;
const SOL_Y = 135;
const SOL_CX = BUS_MID;
const SOL_BOT = SOL_Y + SOL_H;

// 4 blocs sous le bus bar, répartis uniformément
// Onduleur, Ext/Hydro, Batterie, Génératrice
const BOT_Y = 265;
const SLOT_W = BUS_W / 4;
const BUS_INV_X = BUS_X + SLOT_W * 0 + SLOT_W / 2;
const BUS_EXT_X = BUS_X + SLOT_W * 1 + SLOT_W / 2;
const BUS_BAT_X = BUS_X + SLOT_W * 2 + SLOT_W / 2;
const BUS_GEN_X = BUS_X + SLOT_W * 3 + SLOT_W / 2;

// Onduleur
const INV_W = 115;
const INV_H = 130;
const INV_X = BUS_INV_X - INV_W / 2;
const INV_Y = BOT_Y;
const INV_CX = BUS_INV_X;

// Ext/Hydro
const EXT_W = 100;
const EXT_H = 60;
const EXT_X = BUS_EXT_X - EXT_W / 2;
const EXT_Y = BOT_Y;
const EXT_CX = BUS_EXT_X;

// Batterie
const BAT_W = 105;
const BAT_H = 105;
const BAT_X = BUS_BAT_X - BAT_W / 2;
const BAT_Y = BOT_Y;
const BAT_CX = BUS_BAT_X;

// Génératrice
const GEN_W = 105;
const GEN_H = 95;
const GEN_X = BUS_GEN_X - GEN_W / 2;
const GEN_Y = BOT_Y;
const GEN_CX = BUS_GEN_X;

// Zone texte Load (droite, hors bus bar)
const LOAD_X = BUS_X + BUS_W + 20;
const LOAD_Y = BUS_Y - 95;

// ─── Composants ───────────────────────────────────────────────────────────────

function busBar(colour: string) {
	const seg = BUS_W / 10;
	return svg`
		<rect x=${BUS_X} y=${BUS_Y} width=${BUS_W} height=${BUS_H}
			rx="3" fill="none" stroke=${colour} stroke-width="1.5"/>
		<rect x=${BUS_X + 2} y=${BUS_Y + 2} width=${BUS_W - 4} height=${BUS_H - 4}
			rx="2" fill=${colour} opacity="0.15"/>
		${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(
			(i) => svg`
			<line x1=${BUS_X + i * seg} y1=${BUS_Y + 2} x2=${BUS_X + i * seg} y2=${BUS_Y + BUS_H - 2}
				stroke=${colour} stroke-width="0.5" opacity="0.4"/>
		`,
		)}
		<text x=${BUS_MID} y=${BUS_Y - 4} text-anchor="middle"
			font-size="9" fill=${colour} opacity="0.7">Bus bar DC</text>
	`;
}

function ccBlock(
	hass: any,
	entities: any,
	index: number,
	total: number,
	config: any,
) {
	const n = index + 1;
	const col = config.charge_controller?.colour ?? '#BA7517';
	const pvPow = num(
		hass,
		entities[`pv${n}_power`] ?? entities[`pv${n}_power_186`],
	);
	const stage = txt(hass, entities[`cc${n}_charge_stage`]);
	const volt = num(hass, entities[`cc${n}_output_voltage`]);
	const curr = num(hass, entities[`cc${n}_output_current`]);
	const name =
		total > 1
			? `${config.charge_controller?.name ?? 'CC'} ${n}`
			: (config.charge_controller?.name ?? 'Ctrl. charge');

	const totalW = total * CC_W + (total - 1) * CC_GAP;
	const startX = BUS_MID - totalW / 2;
	const x = startX + index * (CC_W + CC_GAP);
	const cx = x + CC_W / 2;
	const bot = CC_Y + CC_H;

	return svg`
		<g style="cursor:pointer">
			<rect x=${x} y=${CC_Y} width=${CC_W} height=${CC_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"/>
			<text x=${cx} y=${CC_Y + 14} text-anchor="middle" font-size="11" font-weight="600" fill=${col}>${name}</text>
			<text x=${cx} y=${CC_Y + 30} text-anchor="middle" font-size="13" font-weight="600"
				fill="var(--primary-text-color)">${fmt(pvPow)}</text>
			<text x=${cx} y=${CC_Y + 46} text-anchor="middle" font-size="10"
				fill="var(--secondary-text-color)">${stage || '—'}</text>
			<text x=${cx} y=${CC_Y + 61} text-anchor="middle" font-size="9"
				fill="var(--secondary-text-color)">
				${fmtV(volt)}${volt > 0 && curr !== 0 ? ' · ' : ''}${fmtA(curr)}
			</text>
			${flowElbow(cx, bot, SOL_CX, SOL_Y, pvPow, col)}
		</g>
	`;
}

function solarBlock(totalPV: number, config: any, col: string) {
	const maxPow = config.solar?.max_power ?? 0;
	const pct = maxPow > 0 ? Math.round((totalPV / maxPow) * 100) : null;
	return svg`
		<g>
			<rect x=${SOL_X} y=${SOL_Y} width=${SOL_W} height=${SOL_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1.5"/>
			<text x=${SOL_CX} y=${SOL_Y + 16} text-anchor="middle" font-size="13" font-weight="600"
				fill="var(--primary-text-color)">${fmt(totalPV)}</text>
			${
				pct !== null
					? svg`
				<text x=${SOL_CX} y=${SOL_Y + 32} text-anchor="middle" font-size="10"
					fill="var(--secondary-text-color)">${pct}%</text>
			`
					: svg``
			}
			${flowLine(SOL_CX, SOL_BOT, SOL_CX, BUS_Y, totalPV, col)}
		</g>
	`;
}

function loadTextZone(hass: any, entities: any, config: any, flow: any) {
	const col = config.load?.colour ?? '#534AB7';
	const acV = num(hass, entities.inverter_voltage_154);
	const freq = num(hass, entities.load_frequency_192);
	const dcV = num(hass, entities.load_dc_voltage);
	const dcA = num(hass, entities.load_dc_current);
	const dly = num(hass, entities.day_load_energy_84);
	const dcPow = dcV > 0 && dcA > 0 ? dcV * dcA : flow.essPow;

	return svg`
		<<text x=${LOAD_X} y=${LOAD_Y} font-size="10" font-weight="600" fill=${col}>Load</text>

		<text x=${LOAD_X} y=${LOAD_Y + 17} font-size="9" font-weight="600"
			fill="var(--secondary-text-color)">DC (SmartShunt)</text>
		<text x=${LOAD_X} y=${LOAD_Y + 30} font-size="9" fill="var(--primary-text-color)">
			${fmt(dcPow)}
		</text>
		<text x=${LOAD_X} y=${LOAD_Y + 43} font-size="9" fill="var(--secondary-text-color)">
			${fmtV(dcV)} · ${fmtA(dcA)}
		</text>
		<text x=${LOAD_X} y=${LOAD_Y + 56} font-size="9" fill="var(--secondary-text-color)">
			${fmtE(dly)}/j
		</text>

		<text x=${LOAD_X} y=${LOAD_Y + 75} font-size="9" font-weight="600"
			fill="var(--secondary-text-color)">AC (${config.inverter_charger?.name ?? 'Onduleur'})</text>
		<text x=${LOAD_X} y=${LOAD_Y + 88} font-size="9" fill="var(--primary-text-color)">
			${fmt(flow.invPow)}
		</text>
		<text x=${LOAD_X} y=${LOAD_Y + 101} font-size="9" fill="var(--secondary-text-color)">
			${fmtV(acV)} · ${fmtHz(freq)}
		</text>

		<line x1=${LOAD_X - 8} y1=${BUS_Y + BUS_H / 2} x2=${LOAD_X} y2=${BUS_Y + BUS_H / 2}
			stroke=${col} stroke-width="1.5" opacity="0.5"
			stroke-dasharray="3 2"/>
	`;
}

function invBlock(hass: any, entities: any, config: any, flow: any) {
	const col = config.inverter_charger?.colour ?? '#185FA5';
	const state = txt(hass, entities.inverter_state);
	const fault = txt(hass, entities.inverter_fault);
	const ags = txt(hass, entities.ags_state);
	const faultOK = !fault || fault === 'OK' || fault === 'ok';
	return svg`
		<g style="cursor:pointer">
			<rect x=${INV_X} y=${INV_Y} width=${INV_W} height=${INV_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"/>
			<text x=${INV_CX} y=${INV_Y + 14} text-anchor="middle" font-size="10" font-weight="600" fill=${col}>
				${config.inverter_charger?.name ?? 'Onduleur'}
			</text>
			<text x=${INV_CX} y=${INV_Y + 28} text-anchor="middle" font-size="10"
				fill="var(--secondary-text-color)">${state || '—'}</text>
			${
				config.inverter_charger?.show_fault !== false && fault
					? svg`
				<text x=${INV_CX} y=${INV_Y + 42} text-anchor="middle" font-size="9"
					fill=${faultOK ? '#3B6D11' : '#D85A30'}>Fault: ${fault}</text>`
					: svg``
			}
			${
				config.inverter_charger?.show_dc_details !== false
					? svg`
				<text x=${INV_CX} y=${INV_Y + 56} text-anchor="middle" font-size="9"
					fill="var(--secondary-text-color)">
					DC: ${fmtV(flow.dcV)} · ${fmtA(flow.dcA)}
				</text>`
					: svg``
			}
			<text x=${INV_CX} y=${INV_Y + 72} text-anchor="middle" font-size="13" font-weight="600"
				fill="var(--primary-text-color)">${fmt(flow.invPow)}</text>
			${
				config.inverter_charger?.show_ags !== false && ags
					? svg`
				<text x=${INV_CX} y=${INV_Y + 86} text-anchor="middle" font-size="9"
					fill="var(--secondary-text-color)">AGS: ${ags}</text>
			`
					: svg``
			}
			<text x=${INV_CX} y=${INV_Y + 100} text-anchor="middle" font-size="9"
				fill="var(--secondary-text-color)">
				${fmtV(num(hass, entities.inverter_voltage_154))}
				${
					num(hass, entities.load_frequency_192) > 0
						? ` · ${num(hass, entities.load_frequency_192).toFixed(1)} Hz`
						: ''
				}
			</text>
			${flowLine(BUS_INV_X, BUS_Y + BUS_H, BUS_INV_X, INV_Y, flow.invPow, col)}
		</g>
	`;
}

function extBlock(hass: any, entities: any, config: any, flow: any) {
	if (!config.external_source?.enabled) return svg``;
	const col = config.external_source?.colour ?? '#5F5E5A';
	const conn = flow.gridConn;
	return svg`
		<g>
			<rect x=${EXT_X} y=${EXT_Y} width=${EXT_W} height=${EXT_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"
				stroke-dasharray=${conn ? 'none' : '4 3'}/>
			<text x=${EXT_CX} y=${EXT_Y + 14} text-anchor="middle" font-size="10" font-weight="600" fill=${col}>
				${config.external_source?.name ?? 'Source ext.'}
			</text>
			<text x=${EXT_CX} y=${EXT_Y + 28} text-anchor="middle" font-size="9"
				fill="var(--secondary-text-color)">${conn ? 'Connecté' : 'Déconnecté'}</text>
			<text x=${EXT_CX} y=${EXT_Y + 42} text-anchor="middle" font-size="9"
				fill="var(--secondary-text-color)">
				${flow.gridPow !== 0 ? fmt(Math.abs(flow.gridPow)) : '—'}
			</text>
			${flowLine(BUS_EXT_X, BUS_Y + BUS_H, BUS_EXT_X, EXT_Y, flow.gridPow, col)}
		</g>
	`;
}

function batBlock(hass: any, entities: any, config: any, flow: any) {
	const col = config.battery?.colour ?? '#0F6E56';
	const soc = Math.min(100, Math.max(0, flow.soc));
	const socW = Math.round(((BAT_W - 20) * soc) / 100);
	const dir = flow.batPow > 10 ? '↑' : flow.batPow < -10 ? '↓' : '—';
	const chg70 = num(hass, entities.day_battery_charge_70);
	const dis71 = num(hass, entities.day_battery_discharge_71);
	return svg`
		<g style="cursor:pointer">
			<rect x=${BAT_X} y=${BAT_Y} width=${BAT_W} height=${BAT_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"/>
			<text x=${BAT_CX} y=${BAT_Y + 14} text-anchor="middle" font-size="10" font-weight="600" fill=${col}>Batteries</text>
			<text x=${BAT_CX} y=${BAT_Y + 29} text-anchor="middle" font-size="13" font-weight="600"
				fill="var(--primary-text-color)">${Math.round(soc)}%</text>
			<rect x=${BAT_X + 8} y=${BAT_Y + 34} width=${BAT_W - 16} height="7"
				rx="2" fill="none" stroke=${col} stroke-width="0.5" opacity="0.4"/>
			<rect x=${BAT_X + 8} y=${BAT_Y + 34} width=${socW} height="7"
				rx="2" fill=${col} opacity="0.6"/>
			<text x=${BAT_CX} y=${BAT_Y + 54} text-anchor="middle" font-size="9"
				fill="var(--secondary-text-color)">
				${fmtV(flow.batV)} · ${fmtA(flow.batA)}
			</text>
			<text x=${BAT_CX} y=${BAT_Y + 67} text-anchor="middle" font-size="9"
				fill="var(--secondary-text-color)">
				${fmt(Math.abs(flow.batPow))} ${dir}
			</text>
			${
				config.battery?.show_daily !== false
					? svg`
				<text x=${BAT_CX} y=${BAT_Y + 80} text-anchor="middle" font-size="9"
					fill="var(--secondary-text-color)">
					↑${fmtE(chg70)} ↓${fmtE(dis71)}
				</text>`
					: svg``
			}
			${flowLine(BUS_BAT_X, BUS_Y + BUS_H, BUS_BAT_X, BAT_Y, flow.batPow, col)}
		</g>
	`;
}

function genBlock(
	hass: any,
	entities: any,
	config: any,
	flow: any,
	maintHours: number,
	maintOverdue: boolean,
	onReset: () => void,
) {
	if (!config.generator?.enabled) return svg``;
	const col = config.generator?.colour ?? '#993C1D';
	const status = txt(hass, entities.generator_status);
	const rt = num(hass, entities.generator_runtime_hours);
	const intv = config.generator?.maintenance_interval_hours ?? 100;
	return svg`
		<g>
			<rect x=${GEN_X} y=${GEN_Y} width=${GEN_W} height=${GEN_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"/>
			<text x=${GEN_CX} y=${GEN_Y + 13} text-anchor="middle" font-size="10" font-weight="600" fill=${col}>
				${config.generator?.name ?? 'Génératrice'}
			</text>
			<text x=${GEN_CX} y=${GEN_Y + 26} text-anchor="middle" font-size="9"
				fill="var(--secondary-text-color)">${status || '—'}</text>
			<text x=${GEN_CX} y=${GEN_Y + 40} text-anchor="middle" font-size="12" font-weight="600"
				fill="var(--primary-text-color)">
				${fmt(flow.genPow)}
			</text>
			${
				config.generator?.rated_power_kw
					? svg`
				<text x=${GEN_CX} y=${GEN_Y + 53} text-anchor="middle" font-size="9"
					fill="var(--secondary-text-color)">/ ${config.generator.rated_power_kw} kW</text>
			`
					: svg``
			}
			${
				config.generator?.show_runtime !== false
					? svg`
				<text x=${GEN_CX} y=${GEN_Y + 66} text-anchor="middle" font-size="9"
					fill="var(--secondary-text-color)">${rt.toFixed(1)} h</text>
			`
					: svg``
			}
			${
				config.generator?.show_maintenance !== false
					? svg`
				<text x=${GEN_CX} y=${GEN_Y + 79} text-anchor="middle" font-size="8"
					fill=${maintOverdue ? '#D85A30' : 'var(--secondary-text-color)'}>
					${maintHours.toFixed(0)}h / ${intv}h
				</text>
				<g style="cursor:pointer" @click=${onReset}>
					<rect x=${GEN_X + 4} y=${GEN_Y + GEN_H + 3} width=${GEN_W - 8} height="12"
						rx="3" fill=${col} fill-opacity="0.25" stroke=${col} stroke-width="0.5"/>
					<text x=${GEN_CX} y=${GEN_Y + GEN_H + 12} text-anchor="middle" font-size="8"
						fill="var(--secondary-text-color)">↺ Remettre à zéro</text>
				</g>
			`
					: svg``
			}
			${flowLine(BUS_GEN_X, BUS_Y + BUS_H, BUS_GEN_X, GEN_Y, flow.genPow, col)}
		</g>
	`;
}

// ─── Export principal ─────────────────────────────────────────────────────────

export const offgridCard = (
	config: sunsynkPowerFlowCardConfig,
	hass: any,
	maintHours: number,
	maintOverdue: boolean,
	onMaintenanceReset: () => void,
) => {
	const e = config.entities;
	const ccCount = config.charge_controller?.count ?? 1;
	const invertBat = config.battery?.invert_power ?? false;
	const ccCol = config.charge_controller?.colour ?? '#BA7517';

	// Somme puissances PV
	let totalPV = 0;
	for (let i = 1; i <= ccCount; i++) {
		totalPV += num(hass, e[`pv${i}_power`] ?? e[`pv${i}_power_186`]);
	}

	// Flux
	const invPow = num(hass, e.inverter_power_175);
	const dcV = num(hass, e.inverter_dc_voltage);
	const dcA = num(hass, e.inverter_dc_current);
	const dcPow = dcV > 0 && dcA > 0 ? dcV * dcA : 0;
	let batPow = num(hass, e.battery_power_190);
	if (invertBat) batPow = -batPow;
	const batV = num(hass, e.battery_voltage_183);
	const batA = num(hass, e.battery_current_191);
	const soc = num(hass, e.battery_soc_184);
	const gridPow = num(hass, e.grid_power_169);
	const gridSt = txt(hass, e.grid_connected_status_194);
	const gridConn = gridSt === 'on' || gridSt === 'true';
	const genV = num(hass, e.generator_voltage);
	const genA = num(hass, e.generator_current);
	let genPow = num(hass, e.generator_power);
	if (genPow === 0 && genV > 0 && genA > 0) genPow = genV * genA;
	const essPow = e.essential_power
		? num(hass, e.essential_power)
		: Math.max(0, invPow - Math.max(0, gridPow));

	const flow = {
		invPow,
		dcV,
		dcA,
		dcPow,
		batPow,
		batV,
		batA,
		soc,
		gridPow,
		gridConn,
		genPow,
		essPow,
	};
	const busCol = '#888780';

	return html`
		<ha-card>
			${config.title
				? html` <div
						style="text-align:center;padding:12px 0 0;
					color:${config.title_colour ?? 'inherit'};
					font-size:${config.title_size ?? '16px'};font-weight:500"
					>
						${config.title}
					</div>`
				: ''}
			<div class="card-content" style="padding:8px">
				<style>
					@keyframes og-fwd {
						to {
							stroke-dashoffset: -24;
						}
					}
					@keyframes og-rev {
						to {
							stroke-dashoffset: 24;
						}
					}
					.og-fwd {
						animation: og-fwd var(--og-ms, 800ms) linear infinite;
					}
					.og-rev {
						animation: og-rev var(--og-ms, 800ms) linear infinite;
					}
				</style>
				<svg
					viewBox="0 0 ${VB_W} ${VB_H}"
					xmlns="http://www.w3.org/2000/svg"
					style="width:${config.card_width ??
					'100%'};height:${config.card_height ?? 'auto'}"
				>
					${busBar(busCol)}
					${Array.from({ length: ccCount }, (_, i) =>
						ccBlock(hass, e, i, ccCount, config),
					)}
					${solarBlock(totalPV, config, ccCol)}
					${loadTextZone(hass, e, config, flow)}
					${invBlock(hass, e, config, flow)}
					${config.show_battery !== false
						? batBlock(hass, e, config, flow)
						: svg``}
					${extBlock(hass, e, config, flow)}
					${genBlock(
						hass,
						e,
						config,
						flow,
						maintHours,
						maintOverdue,
						onMaintenanceReset,
					)}
				</svg>
			</div>
		</ha-card>
	`;
};
