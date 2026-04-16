# UNDER CONSTRUCTION!

# OffGrid Power Flow Card

An animated Home Assistant card to emulate the power flow of a Best Of Breed or non AIO inverter setup. You can use this to display data from any inverter/charger.

This card is based on the beautiful Sunsynk power flow card

## Documentation

Refer to [https://slipx06.github.io/sunsynk-power-flow-card/index.html](https://slipx06.github.io/sunsynk-power-flow-card/index.html)

## Features

- Wide view for 16:9 layout.
- Animated power flow based on positive/negative/zero sensor values with configurable dynamic speed. (Supports inverted battery, AUX and grid power).
- Dynamic battery image based on SOC.
- Grid connected status.
- Configurable battery size and shutdown SOC to calculate and display remaining battery runtime based on current battery usage and system time slot setting i.e. SOC, Grid Charge. Can be toggled off.
- Daily Totals that can be toggled on or off.
- Hide all solar data if not installed or specify number of mppts in use. Set custom MPPT labels.
- "Use Timer" setting and "Energy Pattern" setting (Priority Load or Priority Battery) shown as dynamic icons, with the ability to hide if not required. If setup as switches can be toggled by clicking on the card.
- Card can be scaled by setting the card_height and card_width attributes.
- AUX and Non-essential can be hidden from the full card or assigned configurable labels.
- Customisable - Change colours and images.
- Most entities can be clicked to show more-info dialog.
- Optional data points include self sufficiency and ratio percentages, battery temperature, AC and DC temperature.
- Display additional non-essential, essential and AUX loads.
- Display energy cost per kWh and solar sell status.
- Select your inverter model for custom inverter status and battery status messages i.e. Sunsynk, Lux, Goodwe, Solis.

## Screenshots

![image](https://github.com/qcda1/offgrid-power-flow-card/blob/main/docs/OffGrid_power_flow_chart1.png)

## Installation

The card can be installed via HACS (recommended) or manually.

### Installation using HACS

[![hacs_badge](https://img.shields.io/badge/HACS-Default-blue.svg)](https://github.com/custom-components/hacs)

1. Install HACS.
2. Search & Install sunsynk-power-flow-card or click the button below.

[![Open your Home Assistant instance and open a repository inside the Home Assistant Community Store.](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=slipx06&repository=sunsynk-power-flow-card&category=plugin)

### Manual Installation

1. Create a new directory under `www` and name it `sunsynk-power-flow-card` e.g `www/sunsynk-power-flow-card/`.
2. Copy the `sunsynk-power-flow-card.js` into the directory.
3. Add the resource to your Dashboard. You can append the filename with a `?ver=x` and increment x each time you download a new version to force a reload and avoid using a cached version. It is also a good idea to clear your browser cache.

![image](https://user-images.githubusercontent.com/7227275/235441241-93ab0c7d-341d-428f-8ca8-60ec932dde2d.png)
