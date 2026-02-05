import { supabase } from "./supabase"

export const db = {

  // =========================
  // TICKETS
  // =========================
  async getTickets() {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .order("created_at", { ascending: false })

    return data || []
  },

  async getTicketById(id: string) {
    const { data } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", id)
      .single()

    return data
  },

  async saveTicket(ticket: any) {
    await supabase
      .from("tickets")
      .upsert(ticket)
  },


  // =========================
  // USERS
  // =========================
  async getUsers() {
    const { data } = await supabase
      .from("users")
      .select("*")

    return data || []
  },


  // =========================
  // SETTINGS
  // =========================
  async getSettings() {
    const { data } = await supabase
      .from("settings")
      .select("*")
      .eq("id", "main")
      .single()

    return data || { categories: [], custom_fields: [] }
  },

  async saveSettings(settings: any) {
    await supabase
      .from("settings")
      .upsert(settings)
  }
}
