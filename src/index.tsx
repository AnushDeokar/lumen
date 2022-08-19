import React from "react"
import ReactDOM from "react-dom/client"
import { BrowserRouter, Route, Routes } from "react-router-dom"
import { Root } from "./components/root"
import { GlobalStateProvider } from "./global-state"
import "./index.css"
import { NotePage } from "./pages/note"
import { NotesPage } from "./pages/notes"
import { TagsPage } from "./pages/tags"

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <GlobalStateProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Root />}>
            <Route index element={<NotesPage />} />
            <Route path=":id" element={<NotePage />} />
            <Route path="tags" element={<TagsPage />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GlobalStateProvider>
  </React.StrictMode>,
)
