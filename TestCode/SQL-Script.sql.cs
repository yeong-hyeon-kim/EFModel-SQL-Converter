using System;
using System.ComponentModel.DataAnnotations;

namespace efcore_namespace
{
    [Key]    public string USER_ID    { get; set; }
    [Required]    public string USER_PW   { get; set; }
    [Required]    public string USER_NM   { get; set; }
    public string USER_EMAIL   { get; set; }
}
