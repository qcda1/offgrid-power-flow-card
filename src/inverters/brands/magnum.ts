import {
	InverterSettingsDto,
	InverterStatus,
} from '../dto/inverter-settings.dto';
import { InverterModel } from '../../types';

export class Magnum extends InverterSettingsDto {
	brand = InverterModel.Magnum;
	statusGroups: InverterStatus = {};
	image = '';
}
