import { html, svg } from 'lit';
import { sunsynkPowerFlowCardConfig } from '../types';

// ─── Helpers locaux ───────────────────────────────────────────────────────────

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

function fmtV(v: number): string { return v > 0 ? `${v.toFixed(1)} V` : ''; }
function fmtA(a: number): string { return a !== 0 ? `${Math.abs(a).toFixed(1)} A` : ''; }
function fmtE(k: number): string { return `${k.toFixed(2)} kWh`; }

// ─── Layout constants ─────────────────────────────────────────────────────────

const VB_W = 500;
const VB_H = 460;

// Bus bar
const BUS_X = 70; const BUS_Y = 210; const BUS_W = 360; const BUS_H = 10;

// Contrôleurs (rang haut)
const CC_H = 72; const CC_W = 130; const CC_Y = 60;

// Onduleur (gauche)
const INV_X = 16; const INV_Y = 258; const INV_W = 155; const INV_H = 120;

// Batterie (droite)
const BAT_X = 335; const BAT_Y = 258; const BAT_W = 130; const BAT_H = 95;

// Charges (bas centre)
const LOAD_X = 185; const LOAD_Y = 370; const LOAD_W = 130; const LOAD_H = 62;

// Génératrice (bas gauche)
const GEN_X = 16; const GEN_Y = 375; const GEN_W = 155; const GEN_H = 72;

// Source externe (bas droite)
const EXT_X = 340; const EXT_Y = 368; const EXT_W = 125; const EXT_H = 52;

// ─── Composants SVG ──────────────────────────────────────────────────────────

function busBar(colour: string) {
	const seg = BUS_W / 10;
	return svg`
		<rect x=${BUS_X} y=${BUS_Y} width=${BUS_W} height=${BUS_H}
			rx="3" fill="none" stroke=${colour} stroke-width="1.5"/>
		<rect x=${BUS_X+2} y=${BUS_Y+2} width=${BUS_W-4} height=${BUS_H-4}
			rx="2" fill=${colour} opacity="0.15"/>
		${[1,2,3,4,5,6,7,8,9].map(i => svg`
			<line x1=${BUS_X+i*seg} y1=${BUS_Y+2} x2=${BUS_X+i*seg} y2=${BUS_Y+BUS_H-2}
				stroke=${colour} stroke-width="0.5" opacity="0.4"/>
		`)}
		<text x=${BUS_X+BUS_W/2} y=${BUS_Y-5} text-anchor="middle"
			font-size="9" fill=${colour} opacity="0.8">Bus bar DC</text>
	`;
}

function flowLine(x1:number,y1:number,x2:number,y2:number,power:number,colour:string,dashed=false) {
	const abs = Math.abs(power);
	if (abs < 5) return svg`<line x1=${x1} y1=${y1} x2=${x2} y2=${y2}
		stroke=${colour} stroke-width="1.5" opacity="0.2"/>`;
	const ms = Math.round(2000 - Math.min(abs/5000,1)*1600);
	const da = dashed ? '6 3' : '8 4';
	const cls = power > 0 ? 'og-fwd' : 'og-rev';
	return svg`<line x1=${x1} y1=${y1} x2=${x2} y2=${y2}
		stroke=${colour} stroke-width="2"
		stroke-dasharray=${da}
		style="--og-ms:${ms}ms"
		class=${cls}/>`;
}

function ccBlock(hass:any, entities:any, index:number, total:number, config:any) {
	const n = index + 1;
	const col = config.charge_controller?.colour ?? '#BA7517';
	const pvPow = num(hass, entities[`pv${n}_power`] ?? entities[`pv${n}_power_186`]);
	const stage = txt(hass, entities[`cc${n}_charge_stage`]);
	const volt  = num(hass, entities[`cc${n}_output_voltage`]);
	const curr  = num(hass, entities[`cc${n}_output_current`]);
	const name  = total > 1
		? `${config.charge_controller?.name ?? 'CC'} ${n}`
		: (config.charge_controller?.name ?? 'Ctrl. charge');
	const sp = BUS_W / (total + 1);
	const cx = BUS_X + sp * (index + 1);
	const x  = cx - CC_W / 2;
	const busCx = cx;
	return svg`
		<g style="cursor:pointer">
			<rect x=${x} y=${CC_Y} width=${CC_W} height=${CC_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"/>
			<text x=${cx} y=${CC_Y+14} text-anchor="middle" font-size="11" font-weight="600" fill=${col}>${name}</text>
			<text x=${cx} y=${CC_Y+30} text-anchor="middle" font-size="13" font-weight="600"
				fill="var(--primary-text-color)">${fmt(pvPow)}</text>
			<text x=${cx} y=${CC_Y+45} text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">${stage||'—'}</text>
			<text x=${cx} y=${CC_Y+60} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">
				${fmtV(volt)}${volt>0&&curr!==0?' · ':''}${fmtA(curr)}
			</text>
			${flowLine(busCx, CC_Y+CC_H, busCx, BUS_Y, pvPow, col)}
		</g>
	`;
}

function invBlock(hass:any, entities:any, config:any, flow:any) {
	const col   = config.inverter_charger?.colour ?? '#185FA5';
	const state = txt(hass, entities.inverter_state);
	const fault = txt(hass, entities.inverter_fault);
	const ags   = txt(hass, entities.ags_state);
	const acV   = num(hass, entities.inverter_voltage_154);
	const acA   = num(hass, entities.inverter_current_164);
	const freq  = num(hass, entities.load_frequency_192);
	const cx    = INV_X + INV_W / 2;
	const bx    = BUS_X + 70;
	const faultOK = !fault || fault === 'OK' || fault === 'ok';
	return svg`
		<g style="cursor:pointer">
			<rect x=${INV_X} y=${INV_Y} width=${INV_W} height=${INV_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"/>
			<text x=${cx} y=${INV_Y+14} text-anchor="middle" font-size="11" font-weight="600" fill=${col}>
				${config.inverter_charger?.name ?? 'Onduleur/Chargeur'}
			</text>
			<text x=${cx} y=${INV_Y+30} text-anchor="middle" font-size="11" fill="var(--secondary-text-color)">${state||'—'}</text>
			${config.inverter_charger?.show_fault !== false && fault ? svg`
				<text x=${cx} y=${INV_Y+45} text-anchor="middle" font-size="10"
					fill=${faultOK?'#3B6D11':'#D85A30'}>Fault: ${fault}</text>` : svg``}
			<text x=${cx} y=${INV_Y+59} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">
				${acV>0?`AC: ${fmtV(acV)}`:''}${acA>0?` · ${fmtA(acA)}`:''}${freq>0?` · ${freq.toFixed(1)} Hz`:''}
			</text>
			${config.inverter_charger?.show_dc_details !== false ? svg`
				<text x=${cx} y=${INV_Y+72} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">
					DC: ${fmtV(flow.dcV)||'—'}${flow.dcA>0?` · ${fmtA(flow.dcA)}`:''}
				</text>` : svg``}
			<text x=${cx} y=${INV_Y+87} text-anchor="middle" font-size="13" font-weight="600"
				fill="var(--primary-text-color)">${fmt(flow.invPow)}</text>
			${config.inverter_charger?.show_ags !== false && ags ? svg`
				<text x=${cx} y=${INV_Y+102} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">AGS: ${ags}</text>
			` : svg``}
			${flowLine(bx, INV_Y, bx, BUS_Y+BUS_H, flow.dcPow||flow.invPow, col)}
		</g>
	`;
}

function batBlock(hass:any, entities:any, config:any, flow:any) {
	const col  = config.battery?.colour ?? '#0F6E56';
	const cx   = BAT_X + BAT_W / 2;
	const bx   = BUS_X + BUS_W - 70;
	const soc  = Math.min(100, Math.max(0, flow.soc));
	const socW = Math.round((BAT_W - 20) * soc / 100);
	const dir  = flow.batPow > 10 ? 'Charge' : flow.batPow < -10 ? 'Décharge' : '—';
	const chg70 = num(hass, entities.day_battery_charge_70);
	const dis71 = num(hass, entities.day_battery_discharge_71);
	return svg`
		<g style="cursor:pointer">
			<rect x=${BAT_X} y=${BAT_Y} width=${BAT_W} height=${BAT_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"/>
			<text x=${cx} y=${BAT_Y+14} text-anchor="middle" font-size="11" font-weight="600" fill=${col}>Batteries</text>
			<text x=${cx} y=${BAT_Y+30} text-anchor="middle" font-size="13" font-weight="600"
				fill="var(--primary-text-color)">${Math.round(soc)}%</text>
			<rect x=${BAT_X+10} y=${BAT_Y+36} width=${BAT_W-20} height="8"
				rx="3" fill="none" stroke=${col} stroke-width="0.5" opacity="0.4"/>
			<rect x=${BAT_X+10} y=${BAT_Y+36} width=${socW} height="8"
				rx="3" fill=${col} opacity="0.6"/>
			<text x=${cx} y=${BAT_Y+57} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">
				${fmtV(flow.batV)}${flow.batV>0&&flow.batA!==0?' · ':''}${fmtA(flow.batA)}
			</text>
			<text x=${cx} y=${BAT_Y+70} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">
				${fmt(Math.abs(flow.batPow))} · ${dir}
			</text>
			${config.battery?.show_daily !== false ? svg`
				<text x=${cx} y=${BAT_Y+84} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">
					↑${fmtE(chg70)} ↓${fmtE(dis71)}
				</text>` : svg``}
			${flowLine(bx, BAT_Y, bx, BUS_Y+BUS_H, flow.batPow, col)}
		</g>
	`;
}

function loadBlock(flow:any, config:any, entities:any, hass:any) {
	const col = '#534AB7';
	const cx  = LOAD_X + LOAD_W / 2;
	const icx = INV_X + INV_W / 2;
	const dly = num(hass, entities.day_load_energy_84);
	return svg`
		<g>
			<rect x=${LOAD_X} y=${LOAD_Y} width=${LOAD_W} height=${LOAD_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"/>
			<text x=${cx} y=${LOAD_Y+16} text-anchor="middle" font-size="11" font-weight="600" fill=${col}>Charges</text>
			<text x=${cx} y=${LOAD_Y+34} text-anchor="middle" font-size="13" font-weight="600"
				fill="var(--primary-text-color)">${fmt(flow.essPow)}</text>
			<text x=${cx} y=${LOAD_Y+50} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">
				${fmtE(dly)}/j
			</text>
			${flowLine(icx, INV_Y+INV_H, cx, LOAD_Y, flow.essPow, col)}
		</g>
	`;
}

function genBlock(hass:any, entities:any, config:any, flow:any,
                  maintHours:number, maintOverdue:boolean,
                  onReset:()=>void) {
	if (!config.generator?.enabled) return svg``;
	const col    = config.generator?.colour ?? '#993C1D';
	const cx     = GEN_X + GEN_W / 2;
	const icx    = INV_X + INV_W / 2;
	const status = txt(hass, entities.generator_status);
	const rt     = num(hass, entities.generator_runtime_hours);
	const intv   = config.generator?.maintenance_interval_hours ?? 100;
	return svg`
		<g>
			<rect x=${GEN_X} y=${GEN_Y} width=${GEN_W} height=${GEN_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"/>
			<text x=${cx} y=${GEN_Y+14} text-anchor="middle" font-size="11" font-weight="600" fill=${col}>
				${config.generator?.name ?? 'Génératrice'}
			</text>
			<text x=${cx} y=${GEN_Y+28} text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">${status||'—'}</text>
			<text x=${cx} y=${GEN_Y+42} text-anchor="middle" font-size="13" font-weight="600"
				fill="var(--primary-text-color)">
				${fmt(flow.genPow)}${config.generator?.rated_power_kw?` / ${config.generator.rated_power_kw} kW`:''}
			</text>
			${config.generator?.show_runtime !== false ? svg`
				<text x=${cx} y=${GEN_Y+55} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">${rt.toFixed(1)} h total</text>
			` : svg``}
			${config.generator?.show_maintenance !== false ? svg`
				<text x=${cx} y=${GEN_Y+67} text-anchor="middle" font-size="9"
					fill=${maintOverdue?'#D85A30':'var(--secondary-text-color)'}>
					Entretien: ${maintHours.toFixed(1)}h / ${intv}h${maintOverdue?' !':''}
				</text>
				<g style="cursor:pointer" @click=${onReset}>
					<rect x=${GEN_X+10} y=${GEN_Y+GEN_H-14} width=${GEN_W-20} height="12"
						rx="3" fill=${col} fill-opacity="0.25" stroke=${col} stroke-width="0.5"/>
					<text x=${cx} y=${GEN_Y+GEN_H-5} text-anchor="middle" font-size="9"
						fill="var(--secondary-text-color)">↺ Remettre à zéro</text>
				</g>
			` : svg``}
			${flow.genPow > 10 ? flowLine(GEN_X+GEN_W, GEN_Y+GEN_H/2, icx, INV_Y+INV_H-15, flow.genPow, col, true) : svg``}
		</g>
	`;
}

function extBlock(hass:any, entities:any, config:any, flow:any) {
	if (!config.external_source?.enabled) return svg``;
	const col  = config.external_source?.colour ?? '#5F5E5A';
	const cx   = EXT_X + EXT_W / 2;
	const icx  = INV_X + INV_W / 2;
	const conn = flow.gridConn;
	return svg`
		<g>
			<rect x=${EXT_X} y=${EXT_Y} width=${EXT_W} height=${EXT_H}
				rx="6" fill=${col} fill-opacity="0.12" stroke=${col} stroke-width="1"
				stroke-dasharray=${conn?'none':'4 3'}/>
			<text x=${cx} y=${EXT_Y+14} text-anchor="middle" font-size="11" font-weight="600" fill=${col}>
				${config.external_source?.name ?? 'Source externe'}
			</text>
			<text x=${cx} y=${EXT_Y+28} text-anchor="middle" font-size="10" fill="var(--secondary-text-color)">
				${conn?'Connecté':'Déconnecté'}
			</text>
			<text x=${cx} y=${EXT_Y+42} text-anchor="middle" font-size="9" fill="var(--secondary-text-color)">
				${flow.gridPow!==0?fmt(Math.abs(flow.gridPow)):'—'}
				${flow.gridPow>0?' import':flow.gridPow<0?' export':''}
			</text>
			${conn ? flowLine(EXT_X, EXT_Y+EXT_H/2, INV_X+INV_W, INV_Y+INV_H/2, flow.gridPow, col, true) : svg``}
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

	// Flux de puissance
	const invPow  = num(hass, e.inverter_power_175);
	const dcV     = num(hass, e.inverter_dc_voltage);
	const dcA     = num(hass, e.inverter_dc_current);
	const dcPow   = dcV > 0 && dcA > 0 ? dcV * dcA : 0;
	let batPow    = num(hass, e.battery_power_190);
	if (invertBat) batPow = -batPow;
	const batV    = num(hass, e.battery_voltage_183);
	const batA    = num(hass, e.battery_current_191);
	const soc     = num(hass, e.battery_soc_184);
	const gridPow = num(hass, e.grid_power_169);
	const gridSt  = txt(hass, e.grid_connected_status_194);
	const gridConn = gridSt === 'on' || gridSt === 'true';
	const genV    = num(hass, e.generator_voltage);
	const genA    = num(hass, e.generator_current);
	let genPow    = num(hass, e.generator_power);
	if (genPow === 0 && genV > 0 && genA > 0) genPow = genV * genA;
	const essPow  = e.essential_power
		? num(hass, e.essential_power)
		: Math.max(0, invPow - Math.max(0, gridPow));

	const flow = { invPow, dcV, dcA, dcPow, batPow, batV, batA, soc,
	               gridPow, gridConn, genPow, essPow };
	const busCol = '#888780';

	return html`
		<ha-card>
			${config.title ? html`
				<div style="text-align:center;padding:12px 0 0;
					color:${config.title_colour??'inherit'};
					font-size:${config.title_size??'16px'};font-weight:500">
					${config.title}
				</div>` : ''}
			<div class="card-content" style="padding:8px">
				<style>
					@keyframes og-fwd { to { stroke-dashoffset: -24; } }
					@keyframes og-rev { to { stroke-dashoffset:  24; } }
					.og-fwd { animation: og-fwd var(--og-ms,800ms) linear infinite; }
					.og-rev { animation: og-rev var(--og-ms,800ms) linear infinite; }
				</style>
				<svg viewBox="0 0 ${VB_W} ${VB_H}" xmlns="http://www.w3.org/2000/svg"
					style="width:${config.card_width??'100%'};height:${config.card_height??'auto'}">
					${busBar(busCol)}
					${Array.from({length: ccCount}, (_,i) => ccBlock(hass, e, i, ccCount, config))}
					${invBlock(hass, e, config, flow)}
					${config.show_battery !== false ? batBlock(hass, e, config, flow) : ''}
					${loadBlock(flow, config, e, hass)}
					${genBlock(hass, e, config, flow, maintHours, maintOverdue, onMaintenanceReset)}
					${extBlock(hass, e, config, flow)}
				</svg>
			</div>
		</ha-card>
	`;
};