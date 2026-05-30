using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Newtonsoft.Json;
using System.Text;

namespace march.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]  // ← add this
    public class InterviewController : ControllerBase
    {
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;

        public InterviewController(IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        // Generate Questions
        [HttpPost("questions")]
        public async Task<IActionResult> GenerateQuestions([FromBody] QuestionRequest request)
        {
            try
            {
                var prompt = $@"Generate exactly 5 interview questions for a {request.JobRole} 
                       with {request.Experience} years of experience.
                       Mix technical and behavioral questions.
                       IMPORTANT: Use only single quotes inside questions, never double quotes.
                       Return ONLY a JSON array of 5 strings.
                       Example: [""Question 1"", ""Question 2"", ""Question 3"", ""Question 4"", ""Question 5""]
                       No extra text, no markdown, just the JSON array.";

                var result = await CallGemini(prompt);

                Console.WriteLine("RAW: " + result);

                // Clean markdown
                result = result
                    .Replace("```json", "")
                    .Replace("```", "")
                    .Trim();

                // ← Fix unterminated strings by extracting manually
                var questions = ExtractQuestions(result);

                if (questions == null || questions.Count == 0)
                    return StatusCode(500, new { error = "No questions generated" });

                return Ok(new { questions });
            }
            catch (Exception ex)
            {
                Console.WriteLine("❌ ERROR: " + ex.Message);
                return StatusCode(500, new { error = ex.Message });
            }
        }

        // ← Add this helper method
        private List<string> ExtractQuestions(string raw)
        {
            try
            {
                // Try normal parse first
                return JsonConvert.DeserializeObject<List<string>>(raw);
            }
            catch
            {
                // Fallback — extract lines manually
                var questions = new List<string>();

                var lines = raw
                    .Replace("[", "")
                    .Replace("]", "")
                    .Split('\n');

                foreach (var line in lines)
                {
                    var cleaned = line
                        .Trim()
                        .TrimStart('"')
                        .TrimEnd('"')
                        .TrimEnd(',')
                        .Trim();

                    if (!string.IsNullOrWhiteSpace(cleaned) && cleaned.Length > 10)
                        questions.Add(cleaned);
                }

                return questions.Take(5).ToList();
            }
        }

        // Rate Answer
        [HttpPost("rate")]
        public async Task<IActionResult> RateAnswer([FromBody] RateRequest request)
        {
            var prompt = $@"You are an expert interviewer for {request.JobRole} positions.
                           Question: {request.Question}
                           Candidate's Answer: {request.Answer}
                           
                           Rate this answer from 1-10 and give brief feedback (2-3 lines).
                           Return ONLY this JSON format:
                           {{""score"": 7, ""feedback"": ""Your feedback here""}}
                           No extra text, no markdown, just the JSON.  , and also provide the correct answer in the feedback also , The user is providing the answer using speak to text so there can be a little mistake please notify this";

            var result = await CallGemini(prompt);
            result = result.Replace("```json", "").Replace("```", "").Trim();

            var rating = JsonConvert.DeserializeObject<dynamic>(result);
            return Ok(new { score = (int)rating.score, feedback = (string)rating.feedback });
        }

        private async Task<string> CallGemini(string prompt)
 {
     var apiKey = _configuration["Gemini:ApiKey"];
     var model = _configuration["Gemini:Model"];

     if (string.IsNullOrEmpty(apiKey))
         throw new Exception("ApiKey is missing in appsettings.json");

     var url = $"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={apiKey}";

     var body = new
     {
         contents = new[]
         {
     new { parts = new[] { new { text = prompt } } }
 },
         generationConfig = new { temperature = 0.7, maxOutputTokens = 1000 }
     };

     var client = new HttpClient();
     client.Timeout = TimeSpan.FromMinutes(5);

     var content = new StringContent(JsonConvert.SerializeObject(body), Encoding.UTF8, "application/json");
     var response = await client.PostAsync(url, content);
     var json = await response.Content.ReadAsStringAsync();

     Console.WriteLine("STATUS: " + response.StatusCode);
     Console.WriteLine("RESPONSE: " + json);

     // 503 — High demand
     if ((int)response.StatusCode == 503 || (int)response.StatusCode == 500)
     {
         SendAlertEmail(
             "⚠️ Gemini 503 - High Demand",
             $"Gemini returned 503 High Demand.\n\nResponse: {json}\n\nTime: {DateTime.Now}"
         );
         throw new Exception("Gemini is currently unavailable due to high demand.");
     }

     // 429 — Quota exhausted
     if ((int)response.StatusCode == 429)
     {
         SendAlertEmail(
             "❌ Gemini Quota Exhausted",
             $"Your Gemini API quota is exhausted.\n\nResponse: {json}\n\nTime: {DateTime.Now}"
         );
         throw new Exception("Gemini quota exhausted.");
     }

     // Other errors
     if (!response.IsSuccessStatusCode)
     {
         SendAlertEmail(
             "❌ Gemini API Error",
             $"Gemini returned error {response.StatusCode}.\n\nResponse: {json}\n\nTime: {DateTime.Now}"
         );
         throw new Exception("Gemini API error: " + json);
     }

     var parsed = JsonConvert.DeserializeObject<dynamic>(json);

     if (parsed?.candidates == null || parsed.candidates.Count == 0)
         throw new Exception("No candidates in response: " + json);

     return (string)parsed.candidates[0].content.parts[0].text;
 }

 private void SendAlertEmail(string subject, string body)
 {
     try
     {
         Console.WriteLine("📧 Sending alert email...");

         var email = new MimeMessage();
         email.From.Add(new MailboxAddress("My App Alert", _configuration["Email:From"]));
         email.To.Add(MailboxAddress.Parse("chhabradheeru75@gmail.com"));  // ← your email
         email.Subject = subject;
         email.Body = new TextPart("plain") { Text = body };

         using var smtp = new MailKit.Net.Smtp.SmtpClient();
         smtp.Connect("smtp.gmail.com", 587, MailKit.Security.SecureSocketOptions.StartTls);
         smtp.Authenticate(
             _configuration["Email:From"],
             _configuration["Email:Password"]
         );
         smtp.Send(email);
         smtp.Disconnect(true);

         Console.WriteLine("✅ Alert email sent");
     }
     catch (Exception ex)
     {
         Console.WriteLine("❌ Failed to send alert email: " + ex.Message);
     }
 }
    }

    public class QuestionRequest
    {
        public string JobRole { get; set; }
        public int Experience { get; set; }
    }

    public class RateRequest
    {
        public string JobRole { get; set; }
        public string Question { get; set; }
        public string Answer { get; set; }
    }
}
