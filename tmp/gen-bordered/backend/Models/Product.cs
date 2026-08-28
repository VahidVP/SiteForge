using System.ComponentModel.DataAnnotations.Schema;

namespace Api.Models;

public class Product
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string NameFa { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public string DescriptionFa { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public string ImageUrl { get; set; } = string.Empty;
    public string GalleryJson { get; set; } = "[]";
    public string DetailsJson { get; set; } = "{}";
    [NotMapped]
    public string Details { get => DetailsJson; set => DetailsJson = value; }
    public bool Featured { get; set; }
}
