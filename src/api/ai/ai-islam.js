import axios from "axios"

export default (app) => {
  async function fetchIslamicContent(text) {
    try {
      const response = await axios.get(`https://apizell.web.id/ai/islam?text=${encodeURIComponent(text)}`)
      return response.data
    } catch (error) {
      console.error("Error fetching content from Apizell Islam API:", error)
      throw error
    }
  }
  
  app.get("/ai/islam", async (req, res) => {
    try {
      const { text } = req.query
      if (!text) {
        return res.status(400).json({ status: false, error: "Text is required" })
      }
      
      const result = await fetchIslamicContent(text)
      
      res.status(200).json({
        status: true,
        result,
      })
    } catch (error) {
      res.status(500).json({ status: false, error: error.message })
    }
  })
}