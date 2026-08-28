using System.Text.Json;
using Api.Data;
using Microsoft.EntityFrameworkCore;

namespace Api.Endpoints;

public static class ContentEndpoints
{
    public static List<string> ParseGallery(string json)
    {
        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(json ?? "[]");
            return list ?? new List<string>();
        }
        catch { return new List<string>(); }
    }

    public static List<string> ParseTags(string json)
    {
        try
        {
            var list = JsonSerializer.Deserialize<List<string>>(json ?? "[]");
            return list ?? new List<string>();
        }
        catch { return new List<string>(); }
    }

    public static void MapContentEndpoints(this WebApplication app)
    {
    }
}