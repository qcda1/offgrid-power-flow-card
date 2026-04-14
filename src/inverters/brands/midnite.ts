import {
	InverterSettingsDto,
	InverterStatus,
} from '../dto/inverter-settings.dto';
import { InverterModel } from '../../types';

export class Midnite extends InverterSettingsDto {
	brand = InverterModel.MidniteSolar;
	statusGroups: InverterStatus = {};
	image = '';
}
