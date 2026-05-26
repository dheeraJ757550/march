using march.Data;
using march.models;
using march.Repositories;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

namespace march.Controllers
{

    [Route("api/[controller]")]
    [ApiController]
    [AllowAnonymous]
    public class EmployeeController : ControllerBase
    {
        private readonly IEmployeeRepository _repo;

        public EmployeeController(IEmployeeRepository repo)
        {
            _repo = repo;
        }
        [HttpGet]
        public IActionResult GetAll()
        {
            return Ok(_repo.GetAll());
        }

        [HttpGet("{id}")]
        public IActionResult GetById(int id)
        {
            var employee = _repo.GetById(id);
            if (employee == null) return NotFound();
            return Ok(employee);
        }

        [HttpPost]
        public IActionResult Create(Employee emp)
        {
            _repo.Add(emp);
            return Ok(emp);
        }

        [HttpPut("{id}")]
        public IActionResult Update(int id, Employee emp)
        {
            var existing = _repo.GetById(id);
            if (existing == null) return NotFound();

            existing.Name = emp.Name;
            existing.Salary = emp.Salary;
            existing.Department = emp.Department;
            _repo.Update(existing);
            return Ok(existing);

        }

        [HttpDelete("{id}")]
        public IActionResult DeleteById(int id)
        {
            var emp = _repo.GetById(id);
            if (emp == null) return NotFound();
            _repo.Delete(emp);
            return Ok();
        }



    }
}
