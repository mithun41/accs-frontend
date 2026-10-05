'use client';

import { useEffect, useState } from 'react';
import { pathaoApi } from '@/lib/services';
import { Field, Select } from '@/components/ui/Field';

/**
 * Pathao City → Zone → Area cascading selects.
 * value: { city_id, zone_id, area_id, city_name, zone_name, area_name }
 */
export default function LocationPicker({ value, onChange, errors = {}, required = true }) {
  const [cities, setCities] = useState(null);
  // Remember which parent each list belongs to so stale lists are never shown
  const [zoneList, setZoneList] = useState({ for: null, items: [] });
  const [areaList, setAreaList] = useState({ for: null, items: [] });

  useEffect(() => {
    pathaoApi.cities().then(setCities).catch(() => setCities([]));
  }, []);

  useEffect(() => {
    if (!value.city_id) return;
    const cityId = value.city_id;
    pathaoApi
      .zones(cityId)
      .then((items) => setZoneList({ for: cityId, items }))
      .catch(() => setZoneList({ for: cityId, items: [] }));
  }, [value.city_id]);

  useEffect(() => {
    if (!value.zone_id) return;
    const zoneId = value.zone_id;
    pathaoApi
      .areas(zoneId)
      .then((items) => setAreaList({ for: zoneId, items }))
      .catch(() => setAreaList({ for: zoneId, items: [] }));
  }, [value.zone_id]);

  const zones = value.city_id && zoneList.for === value.city_id ? zoneList.items : [];
  const areas = value.zone_id && areaList.for === value.zone_id ? areaList.items : [];
  const loading = {
    cities: cities === null,
    zones: Boolean(value.city_id) && zoneList.for !== value.city_id,
    areas: Boolean(value.zone_id) && areaList.for !== value.zone_id,
  };
  const cityItems = cities || [];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <Field label="City / District" required={required} error={errors.city_id}>
        <Select
          value={value.city_id || ''}
          disabled={loading.cities}
          error={errors.city_id}
          onChange={(e) => {
            const id = Number(e.target.value) || null;
            const c = cityItems.find((x) => x.city_id === id);
            onChange({ city_id: id, city_name: c?.city_name || '', zone_id: null, zone_name: '', area_id: null, area_name: '' });
          }}
        >
          <option value="">{loading.cities ? 'Loading…' : 'Select city'}</option>
          {cityItems.map((c) => (
            <option key={c.city_id} value={c.city_id}>{c.city_name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Zone / Thana" required={required} error={errors.zone_id}>
        <Select
          value={value.zone_id || ''}
          disabled={!value.city_id || loading.zones}
          error={errors.zone_id}
          onChange={(e) => {
            const id = Number(e.target.value) || null;
            const z = zones.find((x) => x.zone_id === id);
            onChange({ ...value, zone_id: id, zone_name: z?.zone_name || '', area_id: null, area_name: '' });
          }}
        >
          <option value="">{loading.zones ? 'Loading…' : 'Select zone'}</option>
          {zones.map((z) => (
            <option key={z.zone_id} value={z.zone_id}>{z.zone_name}</option>
          ))}
        </Select>
      </Field>
      <Field label="Area" error={errors.area_id}>
        <Select
          value={value.area_id || ''}
          disabled={!value.zone_id || loading.areas}
          onChange={(e) => {
            const id = Number(e.target.value) || null;
            const a = areas.find((x) => x.area_id === id);
            onChange({ ...value, area_id: id, area_name: a?.area_name || '' });
          }}
        >
          <option value="">{loading.areas ? 'Loading…' : 'Select area (optional)'}</option>
          {areas.map((a) => (
            <option key={a.area_id} value={a.area_id}>{a.area_name}</option>
          ))}
        </Select>
      </Field>
    </div>
  );
}
