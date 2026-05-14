using Microsoft.AspNetCore.Mvc;

namespace SAT2_Final.Controllers
{
    public class HomeController : Controller
    {
        public IActionResult Index()
        {
            return View();
        }

        public IActionResult FaceRecognition()
        {
            return View();
        }

        public IActionResult QrScanner()
        {
            return View();
        }

        public IActionResult MediaRecorder()
        {
            return View();
        }

        public IActionResult DataTable()
        {
            return View();
        }

        public IActionResult VideoEditor()
        {
            return View();
        }
    }
}