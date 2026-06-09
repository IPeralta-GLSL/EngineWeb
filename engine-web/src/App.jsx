import React from 'react'
import Scene from './components/Scene'
import Toolbar from './components/Toolbar'
import HierarchyPanel from './components/HierarchyPanel'
import PropertiesPanel from './components/PropertiesPanel'
import AddObjectPanel from './components/AddObjectPanel'
import './App.css'

export default function App() {
  return (
    <div className="app">
      <div className="viewport">
        <Scene />
      </div>
      <Toolbar />
      <HierarchyPanel />
      <PropertiesPanel />
      <AddObjectPanel />
    </div>
  )
}