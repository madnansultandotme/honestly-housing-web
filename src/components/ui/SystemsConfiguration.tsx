'use client';

import { useState } from 'react';
import Card from './Card';
import Input from './Input';

export interface SystemsData {
  hvac: {
    tonnage: string;
    brand: string;
    location: string;
  };
  septic: {
    isAerobic: boolean;
    aerobicType: 'sprayHeads' | 'dripSystem' | '';
    hasTank: boolean;
  };
  propane: {
    size: '250' | '500' | 'other' | '';
    otherSize: string;
  };
  waterHeater: {
    fuelType: 'gas' | 'propane' | 'electric' | '';
    type: 'tankless' | 'tank' | '';
    tankSize: string;
  };
}

interface SystemsConfigurationProps {
  value: SystemsData;
  onChange: (data: SystemsData) => void;
}

export default function SystemsConfiguration({ value, onChange }: SystemsConfigurationProps) {
  const updateHvac = (field: keyof SystemsData['hvac'], val: string) => {
    onChange({
      ...value,
      hvac: { ...value.hvac, [field]: val },
    });
  };

  const updateSeptic = (field: keyof SystemsData['septic'], val: boolean | string) => {
    onChange({
      ...value,
      septic: { ...value.septic, [field]: val },
    });
  };

  const updatePropane = (field: keyof SystemsData['propane'], val: string) => {
    onChange({
      ...value,
      propane: { ...value.propane, [field]: val },
    });
  };

  const updateWaterHeater = (field: keyof SystemsData['waterHeater'], val: string) => {
    onChange({
      ...value,
      waterHeater: { ...value.waterHeater, [field]: val },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          Systems Configuration
        </h3>
        <p className="text-sm text-neutral-600">
          Configure the major systems for this project. This information will automatically populate the relevant scope of work sections.
        </p>
      </div>

      {/* HVAC System */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brass-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-neutral-900">HVAC System</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tonnage
              </label>
              <Input
                type="number"
                step="0.5"
                placeholder="e.g., 3.5"
                value={value.hvac.tonnage}
                onChange={(e) => updateHvac('tonnage', e.target.value)}
              />
              <p className="text-xs text-neutral-500 mt-1">Ton capacity</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Brand
              </label>
              <Input
                type="text"
                placeholder="e.g., Carrier, Trane"
                value={value.hvac.brand}
                onChange={(e) => updateHvac('brand', e.target.value)}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Location
              </label>
              <Input
                type="text"
                placeholder="e.g., Attic, Garage"
                value={value.hvac.location}
                onChange={(e) => updateHvac('location', e.target.value)}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Septic System */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brass-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-neutral-900">Septic System</h4>
          </div>

          <div className="space-y-4">
            {/* Aerobic */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.septic.isAerobic}
                  onChange={(e) => updateSeptic('isAerobic', e.target.checked)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                />
                <span className="text-sm font-medium text-neutral-700">Aerobic System</span>
              </label>
            </div>

            {/* Aerobic Type (conditional) */}
            {value.septic.isAerobic && (
              <div className="ml-6 space-y-2">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Aerobic Type
                </label>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="aerobicType"
                      value="sprayHeads"
                      checked={value.septic.aerobicType === 'sprayHeads'}
                      onChange={(e) => updateSeptic('aerobicType', e.target.value)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                    />
                    <span className="text-sm text-neutral-700">Spray Heads</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="aerobicType"
                      value="dripSystem"
                      checked={value.septic.aerobicType === 'dripSystem'}
                      onChange={(e) => updateSeptic('aerobicType', e.target.value)}
                      className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                    />
                    <span className="text-sm text-neutral-700">Drip System</span>
                  </label>
                </div>
              </div>
            )}

            {/* Tank */}
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={value.septic.hasTank}
                  onChange={(e) => updateSeptic('hasTank', e.target.checked)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 rounded focus:ring-brass-500"
                />
                <span className="text-sm font-medium text-neutral-700">Has Tank</span>
              </label>
            </div>
          </div>
        </div>
      </Card>

      {/* Propane */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brass-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-neutral-900">Propane Tank</h4>
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Tank Size
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="propaneSize"
                  value="250"
                  checked={value.propane.size === '250'}
                  onChange={(e) => updatePropane('size', e.target.value)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                />
                <span className="text-sm text-neutral-700">250 Gallon</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="propaneSize"
                  value="500"
                  checked={value.propane.size === '500'}
                  onChange={(e) => updatePropane('size', e.target.value)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                />
                <span className="text-sm text-neutral-700">500 Gallon</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="propaneSize"
                  value="other"
                  checked={value.propane.size === 'other'}
                  onChange={(e) => updatePropane('size', e.target.value)}
                  className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                />
                <span className="text-sm text-neutral-700">Other</span>
              </label>
            </div>

            {value.propane.size === 'other' && (
              <div className="mt-3 ml-6">
                <Input
                  type="text"
                  placeholder="Specify tank size"
                  value={value.propane.otherSize}
                  onChange={(e) => updatePropane('otherSize', e.target.value)}
                />
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Water Heater */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brass-100 flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-brass-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h4 className="text-base font-semibold text-neutral-900">Water Heater</h4>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Fuel Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Fuel Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="waterHeaterFuel"
                    value="gas"
                    checked={value.waterHeater.fuelType === 'gas'}
                    onChange={(e) => updateWaterHeater('fuelType', e.target.value)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                  />
                  <span className="text-sm text-neutral-700">Gas</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="waterHeaterFuel"
                    value="propane"
                    checked={value.waterHeater.fuelType === 'propane'}
                    onChange={(e) => updateWaterHeater('fuelType', e.target.value)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                  />
                  <span className="text-sm text-neutral-700">Propane</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="waterHeaterFuel"
                    value="electric"
                    checked={value.waterHeater.fuelType === 'electric'}
                    onChange={(e) => updateWaterHeater('fuelType', e.target.value)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                  />
                  <span className="text-sm text-neutral-700">Electric</span>
                </label>
              </div>
            </div>

            {/* Type */}
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Water Heater Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="waterHeaterType"
                    value="tankless"
                    checked={value.waterHeater.type === 'tankless'}
                    onChange={(e) => updateWaterHeater('type', e.target.value)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                  />
                  <span className="text-sm text-neutral-700">Tankless</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="waterHeaterType"
                    value="tank"
                    checked={value.waterHeater.type === 'tank'}
                    onChange={(e) => updateWaterHeater('type', e.target.value)}
                    className="w-4 h-4 text-brass-600 border-neutral-300 focus:ring-brass-500"
                  />
                  <span className="text-sm text-neutral-700">Tank</span>
                </label>
              </div>
            </div>
          </div>

          {/* Tank Size (conditional) */}
          {value.waterHeater.type === 'tank' && (
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Tank Size (Gallons)
              </label>
              <Input
                type="number"
                placeholder="e.g., 40, 50, 80"
                value={value.waterHeater.tankSize}
                onChange={(e) => updateWaterHeater('tankSize', e.target.value)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Summary */}
      <Card className="p-4 bg-brass-50 border-brass-200">
        <div className="flex items-start gap-3">
          <svg className="w-5 h-5 text-brass-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="flex-1">
            <p className="text-sm font-medium text-neutral-900 mb-1">
              System Information
            </p>
            <p className="text-xs text-neutral-600">
              This information will automatically populate the HVAC, Plumbing, and related scope of work sections.
              You can update these details later if needed.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
