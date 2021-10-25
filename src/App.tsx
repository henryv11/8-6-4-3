/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
/* eslint-disable react/require-default-props */
import React, { createContext, Dispatch, ReactNode, SetStateAction, useContext, useEffect, useState } from 'react';
import './App.css';

const defaultLifts: Record<string, number> = {
  'Bench Press': 160,
  'Incline Dumbbell Press': 60,

  Squat: 240,
  Deadlift: 280,

  'Barbell Overhead Press': 100,
  'Dumbbell Overhead Press': 50,

  Dips: 90,
  'Close-Grip Bench Press': 140,

  'Pull-ups': 50,
};

const defaultValue = {
  lifts: defaultLifts,
  setLifts: ((() => undefined) as unknown) as Dispatch<SetStateAction<typeof defaultLifts>>,
};

const liftsContext = createContext(defaultValue);

function LiftsContextProvider({ children = null }: { children?: ReactNode }) {
  const [lifts, setLifts] = useState({});

  useEffect(() => {
    const liftsLocalStorage = localStorage.getItem('lifts');
    if (liftsLocalStorage) {
      setLifts(JSON.parse(liftsLocalStorage));
    } else {
      setLifts(defaultLifts);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('lifts', JSON.stringify(lifts));
  }, [lifts]);

  return <liftsContext.Provider value={{ lifts, setLifts }}>{children}</liftsContext.Provider>;
}

const useLiftsContext = () => useContext(liftsContext);

function LiftTableRow({
  name: nameProp,
  max: maxProp,
  onSave,
  onDelete = () => undefined,
  onCancel = () => undefined,
  isAddingNew = false,
}: {
  name: string;
  max: number;
  onSave: (lift: { name: string; max: number }) => void;
  onDelete?: (lift: { name: string }) => void;
  onCancel?: () => void;
  isAddingNew?: boolean;
}) {
  const [name, setName] = useState(nameProp);
  const [max, setMax] = useState(maxProp);
  const [isEditing, setIsEditing] = useState(false);

  return (
    <tr className="border-b-2">
      <td>
        <input
          className="rounded border p-1 w-full"
          value={name}
          disabled={!isAddingNew && !isEditing}
          onChange={(ev) => setName(ev.target.value)}
        />
      </td>
      <td>
        <input
          className="rounded border p-1 w-full"
          value={max}
          type="number"
          disabled={!isAddingNew && !isEditing}
          onChange={(ev) => setMax(Number(ev.target.value))}
        />
      </td>
      <td className="flex justify-around">
        {isEditing || isAddingNew ? (
          <>
            <button
              className="bg-green-500 hover:bg-green-700 py-1 px-2 rounded text-white"
              type="button"
              onClick={() => {
                setIsEditing(false);
                onSave({ name, max });
              }}
            >
              Save
            </button>

            <button
              className="bg-yellow-500 hover:bg-yellow-700 py-1 px-2 rounded text-white"
              type="button"
              onClick={() => {
                setIsEditing(false);
                setName(nameProp);
                setMax(maxProp);
                onCancel();
              }}
            >
              Cancel
            </button>

            {isEditing && (
              <button
                className="bg-red-500 hover:bg-red-700 py-1 px-2 rounded text-white"
                type="button"
                onClick={() => {
                  onDelete({ name });
                }}
              >
                Delete
              </button>
            )}
          </>
        ) : (
          <button
            className="bg-blue-500 hover:bg-blue-700 py-1 px-2 rounded text-white"
            type="button"
            onClick={() => {
              setIsEditing(true);
            }}
          >
            Edit
          </button>
        )}
      </td>
    </tr>
  );
}

function LiftsTable() {
  const { lifts, setLifts } = useLiftsContext();
  const [isAddingNewLift, setIsAddingNewLift] = useState(false);

  return (
    <table className="w-full table-fixed">
      <thead>
        <tr className="border bg-gray-200">
          <th className="text-center">Lift</th>
          <th className="text-center">1RM</th>
          <th className="text-center">Actions</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(lifts)
          .sort(([n1], [n2]) => n1.localeCompare(n2))
          .map(([name, max]) => (
            <LiftTableRow
              key={name}
              name={name}
              max={max}
              onSave={(lift) => {
                setLifts((liftsState) => {
                  delete liftsState[name];
                  liftsState[lift.name] = lift.max;
                  return { ...liftsState };
                });
              }}
              onDelete={(lift) => {
                setLifts((liftsState) => {
                  delete liftsState[lift.name];
                  return { ...liftsState };
                });
              }}
            />
          ))}

        {isAddingNewLift ? (
          <LiftTableRow
            name=""
            max={0}
            isAddingNew
            onSave={(lift) => {
              if (!lift.name) {
                alert('Please choose a name for the lift');
                return;
              }

              if (lifts[lift.name]) {
                alert('lift with such name already exists!');
                return;
              }

              setLifts((liftsState) => {
                liftsState[lift.name] = lift.max;
                return { ...liftsState };
              });
              setIsAddingNewLift(false);
            }}
            onCancel={() => {
              setIsAddingNewLift(false);
            }}
          />
        ) : (
          <tr className="bg-gray-200">
            <td colSpan={3} className="px-4">
              <button
                className="bg-blue-500 hover:bg-blue-700 py-1 px-3 rounded text-white float-right"
                type="button"
                onClick={() => {
                  setIsAddingNewLift(true);
                }}
              >
                +
              </button>
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}

function ProgramTableRow({ name, week, max }: { name: string; max: number; week: number }) {
  const schemeByWeek = [
    { sets: 3, reps: 8, percentage: 0.575 },
    { sets: 4, reps: 6, percentage: 0.65 },
    { sets: 6, reps: 4, percentage: 0.725 },
    { sets: 8, reps: 3, percentage: 0.8 },
  ];
  const { sets, reps, percentage } = schemeByWeek[week];
  const weight = 2.5 * Math.ceil((max * percentage) / 2.5);
  const total = (sets * reps * weight).toFixed(0);

  return (
    <tr className="border-b-2">
      <td className="text-center font-bold">{name}</td>
      <td className="text-center">{sets}</td>
      <td className="text-center">{reps}</td>
      <td className="text-center">{`${(percentage * 100).toFixed(1)}%`}</td>
      <td className="text-center">{weight}</td>
      <td className="text-center">{total}</td>
    </tr>
  );
}

function ProgramTable() {
  const { lifts } = useLiftsContext();
  const [week, setWeek] = useState(0);

  return (
    <>
      <table className="w-full table-fixed">
        <thead>
          <tr className="border bg-gray-200">
            <th className="text-center">Lift</th>
            <th className="text-center">Sets</th>
            <th className="text-center">Reps</th>
            <th className="text-center">Percentage</th>
            <th className="text-center">Weight</th>
            <th className="text-center">Total</th>
          </tr>
        </thead>
        <tbody>
          {Object.entries(lifts)
            .sort(([n1], [n2]) => n1.localeCompare(n2))
            .map(([name, max]) => (
              <ProgramTableRow key={name} name={name} max={max} week={week} />
            ))}
          <tr className="bg-gray-200">
            <td colSpan={6} className="px-4 text-center">
              <div className="flex items-center justify-between">
                <button
                  disabled={week === 0}
                  className="bg-blue-500 hover:bg-blue-700 py-1 px-3 rounded text-white float-left"
                  type="button"
                  onClick={() => setWeek(week - 1)}
                >
                  {'<<'}
                </button>
                <span className="font-light">Week {week + 1}</span>
                <button
                  disabled={week === 3}
                  className="bg-blue-500 hover:bg-blue-700 py-1 px-3 rounded text-white float-right"
                  type="button"
                  onClick={() => setWeek(week + 1)}
                >
                  {'>>'}
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </>
  );
}

function App() {
  return (
    <LiftsContextProvider>
      <main>
        <h1 className="font-bold text-2xl">Lifts</h1>
        <LiftsTable />
        <h1 className="font-bold text-2xl">Program</h1>
        <ProgramTable />
      </main>
    </LiftsContextProvider>
  );
}

export default App;
