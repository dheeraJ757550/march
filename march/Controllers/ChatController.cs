using march.Data;
using march.models;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Net.Http.Headers;
using System.Text;

namespace march.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    
    public class ChatController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;

        // It's best practice to use IHttpClientFactory in ASP.NET Core

        public ChatController(IHttpClientFactory httpClientFactory)
        {
            _httpClientFactory = httpClientFactory;
        }

        [HttpPost]
        public async Task<IActionResult> Ask([FromBody] ChatRequest request)
        {
            string userMessage = request.Message;

            // Updated to a valid 2026 model
            var model = "gemini-3-flash-preview";
            var apiKey = "AIzaSyBu4wrMsLAdxTIk48oH3gDk8rUUfpOs1Ak";

            // Ensure you are using v1beta or v1 as per current documentation
            var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

            var body = new
            {
                contents = new[]
     {
        new
        {
            parts = new[]
            {
                new
                {
                    text = $"Format the response in short bullet points or lines. Avoid long paragraphs.\n\nUser Query: {userMessage}"
                }
            }
        }
    }
            };

            using var client = _httpClientFactory.CreateClient();
            var content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");

            var response = await client.PostAsync(url, content);
            var responseString = await response.Content.ReadAsStringAsync();

            if (response.IsSuccessStatusCode)
            {
                var jsonResponse = JsonConvert.DeserializeObject<dynamic>(responseString);
                // Gemini structure: candidates -> content -> parts -> text
                string messageText = jsonResponse.candidates[0].content.parts[0].text;
                return Ok(new { reply = messageText });
            }

            return StatusCode((int)response.StatusCode, responseString);
        }
        public class ChatRequest
        {
            public string Message { get; set; }
        }
    }

}
