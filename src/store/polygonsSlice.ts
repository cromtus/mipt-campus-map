import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { BuildingDescription, Polygon } from '../types';
import { DraftFunction } from 'use-immer';

interface PolygonState {
  polygons: Polygon[];
  selectedIndex: number;
}

const initialState: PolygonState = {
  polygons: [],
  selectedIndex: -1,
};

type Building = Polygon & { type: 'building' };

const slice = createSlice({
  name: 'polygon',
  initialState,
  reducers: {
    addPolygon(state, action: PayloadAction<Polygon>) {
      state.polygons.push(action.payload);
    },

    setSelected(state, action: PayloadAction<number>) {
      state.selectedIndex = action.payload;
    },

    unselect(state) {
      state.selectedIndex = -1;
    },

    updateNode(
      state,
      action: PayloadAction<{ nodeIndex: number; x: number; y: number }>
    ) {
      if (state.selectedIndex < 0) return;
      const { nodeIndex, x, y } = action.payload;
      state.polygons[state.selectedIndex].points[nodeIndex] = [x, y];
    },

    movePolygon(state, action: PayloadAction<{ index: number; dx: number; dy: number }>) {
      const { index, dx, dy } = action.payload;
      state.polygons[index].points.forEach(point => {
        point[0] += dx;
        point[1] += dy;
      });
    },

    toggleDescription(state) {
      if (state.selectedIndex < 0) return;
      const polygon = state.polygons[state.selectedIndex];
      if (polygon.type !== 'building') return
      if (polygon.description == null) {
        polygon.description = {
          text: '',
          offsetX: 0,
          offsetY: 0,
          alignment: 'center',
          reversed: false
        };
      } else {
        delete polygon.description;
      }
    },

    updateDescriptionFully(state, action: PayloadAction<DraftFunction<BuildingDescription>>) {
      if (state.selectedIndex < 0) return;
      const polygon = state.polygons[state.selectedIndex];
      if (polygon.type !== 'building' || polygon.description == null) return;
      action.payload(polygon.description);
    },

    updateBuildingFully(state, action: PayloadAction<DraftFunction<Building>>) {
      if (state.selectedIndex < 0) return;
      const polygon = state.polygons[state.selectedIndex];
      if (polygon.type !== 'building') return;
      action.payload(polygon);
    },

    deletePolygon(state) {
      if (state.selectedIndex < 0) return;
      state.polygons.splice(state.selectedIndex, 1);
      state.selectedIndex = -1;
    },
  },
});

export default slice.reducer;

export const {
  addPolygon,
  setSelected,
  unselect,
  updateNode,
  movePolygon,
  toggleDescription,
  deletePolygon,
} = slice.actions;

const getBuildingUpdater = <T extends keyof Building>(param: T) => (
  (value: Building[T]) => (
    slice.actions.updateBuildingFully((draft: Building) => {
      (draft as any)[param] = value;
    })
  )
);

export const updateColor = getBuildingUpdater('color');
export const updateHeight = getBuildingUpdater('height');
export const updateSecondaryColor = getBuildingUpdater('secondaryColor');

export const addEntry = () => (
  slice.actions.updateBuildingFully((draft: Building) => {
    draft.entries.push({ id: new Date().getTime().toString(), position: 0 });
  })
);

export const updateEntry = (id: string, position: number) => (
  slice.actions.updateBuildingFully((draft: Building) => {
    const entry = draft.entries.find(e => e.id === id);
    if (entry) entry.position = position;
  })
);

export const removeEntry = (id: string) => (
  slice.actions.updateBuildingFully((draft: Building) => {
    draft.entries = draft.entries.filter(e => e.id !== id);
  })
);

const getDescriptionUpdater = <T extends keyof BuildingDescription>(param: T) => (
  (value: BuildingDescription[T]) => (
    slice.actions.updateDescriptionFully(draft => {
      (draft as any)[param] = value;
    })
  )
);

export const updateDescriptionText = getDescriptionUpdater('text');
export const updateDescriptionAlignment = getDescriptionUpdater('alignment');
export const updateDescriptionReversed = getDescriptionUpdater('reversed');

export const toggleDescriptionReversed = () => (
  slice.actions.updateDescriptionFully(draft => {
    draft.reversed = !draft.reversed;
  })
);

export const updateDescriptionOffset = (offsetX: number, offsetY: number) => (
  slice.actions.updateDescriptionFully(draft => {
    draft.offsetX = offsetX;
    draft.offsetY = offsetY;
  })
);

export const selectCurrentPolygon = (state: { polygons: PolygonState }) => (
  state.polygons.selectedIndex >= 0 ?
    state.polygons.polygons[state.polygons.selectedIndex]
  : null
);
